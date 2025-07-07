// GET /api/billing/summary - Résumé financier global
// Accès : utilisateur connecté (ses données) ou admin (toutes)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types';

export async function GET() {
  try {
    // TODO: Remplacer par la vraie authentification JWT
    const user = {
      id: 'user-placeholder',
      email: 'user@example.com',
      role: 'USER' as UserRole
    };

    // Contrainte par utilisateur pour les non-admins
    const userFilter = user.role !== UserRole.ADMIN ? { userId: user.id } : {};

    // Récupération des données de facturation
    const [
      invoiceStats,
      paymentStats,
      recentInvoices,
      overdueInvoices,
      monthlyTrends,
    ] = await Promise.all([
      // Statistiques des factures
      prisma.invoice.aggregate({
        where: userFilter,
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      // Statistiques des paiements (seulement les COMPLETED)
      prisma.payment.aggregate({
        where: { ...userFilter, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true },
      }),

      // Factures récentes (30 derniers jours)
      prisma.invoice.findMany({
        where: {
          ...userFilter,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
          },
        },
        select: {
          id: true,
          number: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Factures en retard
      prisma.invoice.findMany({
        where: {
          ...userFilter,
          status: 'PENDING',
          dueDate: {
            lt: new Date(),
          },
        },
        select: {
          id: true,
          number: true,
          totalAmount: true,
          dueDate: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      // Tendances mensuelles (12 derniers mois)
      prisma.invoice.groupBy({
        by: ['createdAt'],
        where: {
          ...userFilter,
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 12 mois
          },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
    ]);

    // Calcul des KPIs principaux
    const totalInvoiced = Number(invoiceStats._sum.totalAmount || 0);
    const totalPaid = Number(paymentStats._sum.amount || 0);
    const totalPending = totalInvoiced - totalPaid;
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);

    // Traitement des tendances mensuelles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monthlyData = monthlyTrends.reduce((acc: Record<string, { count: number; amount: number }>, trend: any) => {
      const month = new Date(trend.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { count: 0, amount: 0 };
      }
      acc[month].count += trend._count.id;
      acc[month].amount += Number(trend._sum.totalAmount || 0);
      return acc;
    }, {});

    // Génération des 12 derniers mois complets
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      last12Months.push({
        month: monthName,
        key: monthKey,
        count: monthlyData[monthKey]?.count || 0,
        amount: monthlyData[monthKey]?.amount || 0,
      });
    }

    // Calcul des ratios et métriques
    const averageInvoiceAmount = invoiceStats._count.id > 0 ? totalInvoiced / invoiceStats._count.id : 0;
    const paymentRatio = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    // Répartition par statut des factures
    const statusBreakdown = await prisma.invoice.groupBy({
      by: ['status'],
      where: userFilter,
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const summary = {
      // KPIs principaux
      overview: {
        totalInvoiced,
        totalPaid,
        totalPending,
        totalOverdue: overdueAmount,
        averageInvoiceAmount,
        paymentRatio: Math.round(paymentRatio * 100) / 100,
        invoiceCount: invoiceStats._count.id,
        paymentCount: paymentStats._count.id,
        overdueCount: overdueInvoices.length,
      },

      // Répartition par statut
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byStatus: statusBreakdown.reduce((acc: Record<string, { count: number; amount: number }>, status: any) => {
        acc[status.status] = {
          count: status._count.id,
          amount: Number(status._sum.totalAmount || 0),
        };
        return acc;
      }, {}),

      // Tendances mensuelles
      monthlyTrends: last12Months,

      // Factures récentes
      recentInvoices,

      // Factures en retard
      overdueInvoices,

      // Prochaines actions recommandées
      recommendations: [
        ...(overdueInvoices.length > 0 ? [`${overdueInvoices.length} facture(s) en retard nécessitent un suivi`] : []),
        ...(totalPending > totalPaid * 0.3 ? ['Le montant en attente représente plus de 30% du total encaissé'] : []),
        ...(recentInvoices.length === 0 ? ['Aucune nouvelle facture ce mois-ci'] : []),
      ],
    };

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Erreur lors de la génération du résumé financier:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
