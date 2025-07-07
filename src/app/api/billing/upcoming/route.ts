// GET /api/billing/upcoming - Prochaines échéances de paiement
// Accès : utilisateur connecté (ses factures) ou admin (toutes)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // TODO: Remplacer par la vraie authentification JWT
    const user = {
      id: 'user-placeholder',
      email: 'user@example.com',
      role: 'USER' as UserRole
    };

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30'); // Par défaut 30 jours

    // Validation du paramètre days
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Le paramètre days doit être entre 1 et 365' },
        { status: 400 }
      );
    }

    // Contrainte par utilisateur pour les non-admins
    const userFilter = user.role !== UserRole.ADMIN ? { userId: user.id } : {};

    // Dates de référence
    const now = new Date();
    const inXDays = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Requêtes pour différentes catégories d'échéances
    const [
      overdueInvoices,
      dueThisWeek,
      dueThisMonth,
      dueInPeriod,
      upcomingStats
    ] = await Promise.all([
      // Factures en retard
      prisma.invoice.findMany({
        where: {
          ...userFilter,
          status: 'PENDING',
          dueDate: { lt: now },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
          payments: {
            where: { status: 'COMPLETED' },
            select: { amount: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),

      // Factures dues cette semaine
      prisma.invoice.findMany({
        where: {
          ...userFilter,
          status: 'PENDING',
          dueDate: {
            gte: now,
            lte: oneWeekFromNow,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
          payments: {
            where: { status: 'COMPLETED' },
            select: { amount: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),

      // Factures dues ce mois
      prisma.invoice.findMany({
        where: {
          ...userFilter,
          status: 'PENDING',
          dueDate: {
            gte: oneWeekFromNow,
            lte: oneMonthFromNow,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
          payments: {
            where: { status: 'COMPLETED' },
            select: { amount: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),

      // Toutes les factures dans la période spécifiée
      prisma.invoice.findMany({
        where: {
          ...userFilter,
          status: 'PENDING',
          dueDate: {
            gte: now,
            lte: inXDays,
          },
        },
        select: {
          id: true,
          number: true,
          totalAmount: true,
          dueDate: true,
        },
        orderBy: { dueDate: 'asc' },
      }),

      // Statistiques globales des échéances
      prisma.invoice.aggregate({
        where: {
          ...userFilter,
          status: 'PENDING',
          dueDate: { lte: inXDays },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
    ]);

    // Enrichissement des données avec calculs des montants restants
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichInvoices = (invoices: any[]) => {
      return invoices.map(invoice => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalPaid = invoice.payments?.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0) || 0;
        const remainingAmount = Number(invoice.totalAmount) - totalPaid;
        const daysOverdue = invoice.dueDate < now ? Math.ceil((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const daysUntilDue = invoice.dueDate > now ? Math.ceil((invoice.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return {
          ...invoice,
          remainingAmount,
          daysOverdue,
          daysUntilDue,
          isOverdue: invoice.dueDate < now,
          urgencyLevel: daysOverdue > 30 ? 'critical' : daysOverdue > 7 ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low',
        };
      });
    };

    // Calcul des totaux par catégorie
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calculateTotals = (invoices: any[]) => {
      return {
        count: invoices.length,
        amount: invoices.reduce((sum, invoice) => sum + invoice.remainingAmount, 0),
      };
    };

    const enrichedOverdue = enrichInvoices(overdueInvoices);
    const enrichedDueThisWeek = enrichInvoices(dueThisWeek);
    const enrichedDueThisMonth = enrichInvoices(dueThisMonth);

    // Génération du planning hebdomadaire
    const weeklyPlanning = [];
    for (let i = 0; i < Math.min(4, Math.ceil(days / 7)); i++) {
      const weekStart = new Date(now.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      const weekInvoices = dueInPeriod.filter(invoice => {
        const dueDate = new Date(invoice.dueDate);
        return dueDate >= weekStart && dueDate <= weekEnd;
      });

      weeklyPlanning.push({
        week: `Semaine du ${weekStart.toLocaleDateString('fr-FR')}`,
        startDate: weekStart,
        endDate: weekEnd,
        invoices: weekInvoices,
        count: weekInvoices.length,
        amount: weekInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0),
      });
    }

    const summary = {
      // Vue d'ensemble des échéances
      overview: {
        totalUpcoming: upcomingStats._count.id,
        totalAmount: Number(upcomingStats._sum.totalAmount || 0),
        averageAmount: upcomingStats._count.id > 0 ? Number(upcomingStats._sum.totalAmount || 0) / upcomingStats._count.id : 0,
        periodDays: days,
      },

      // Catégories d'échéances
      categories: {
        overdue: {
          ...calculateTotals(enrichedOverdue),
          items: enrichedOverdue,
        },
        dueThisWeek: {
          ...calculateTotals(enrichedDueThisWeek),
          items: enrichedDueThisWeek.slice(0, 10), // Limiter à 10 pour l'affichage
        },
        dueThisMonth: {
          ...calculateTotals(enrichedDueThisMonth),
          items: enrichedDueThisMonth.slice(0, 10), // Limiter à 10 pour l'affichage
        },
      },

      // Planning hebdomadaire
      weeklyPlanning,

      // Actions prioritaires
      priorityActions: [
        ...enrichedOverdue.filter(invoice => invoice.urgencyLevel === 'critical').slice(0, 5),
        ...enrichedDueThisWeek.filter(invoice => invoice.daysUntilDue <= 3).slice(0, 3),
      ],

      // Recommandations
      recommendations: [
        ...(enrichedOverdue.length > 0 ? [`${enrichedOverdue.length} facture(s) en retard nécessitent un recouvrement immédiat`] : []),
        ...(enrichedDueThisWeek.length > 5 ? ['Forte charge de paiements prévue cette semaine'] : []),
        ...(calculateTotals(enrichedOverdue).amount > calculateTotals(enrichedDueThisWeek).amount * 2 ? ['Le montant en retard est élevé par rapport aux échéances'] : []),
      ],
    };

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Erreur lors de la récupération des échéances:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
