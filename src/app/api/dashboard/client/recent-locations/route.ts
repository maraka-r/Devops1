import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/client/recent-locations
 * Locations récentes du client
 * 
 * @description Fournit la liste des locations récentes d'un client :
 * - Locations actives en cours
 * - Locations récemment terminées
 * - Locations à venir
 * - Historique détaillé avec informations matériel
 * 
 * @param {string} userId - ID de l'utilisateur (query parameter)
 * @param {number} limit - Nombre de résultats (optional, default: 10)
 * @param {string} status - Filtrer par statut (optional: 'ACTIVE', 'COMPLETED', 'PENDING', 'CANCELLED')
 * @returns {Object} Liste des locations récentes
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statusFilter = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId est requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Construire les filtres
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where = { userId, ...(statusFilter && { status: statusFilter as any }) };

    // Récupérer les locations récentes
    const locations = await prisma.location.findMany({
      where,
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerDay: true,
            images: true,
            status: true
          }
        },
        invoiceItems: {
          include: {
            invoice: {
              select: {
                id: true,
                number: true,
                status: true,
                totalAmount: true,
                dueDate: true,
                paidDate: true
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE first, then PENDING, COMPLETED, CANCELLED
        { createdAt: 'desc' }
      ],
      take: limit
    });

    const now = new Date();

    // Enrichir les données avec des informations calculées
    const enrichedLocations = locations.map(location => {
      const durationDays = Math.ceil(
        (location.endDate.getTime() - location.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let timeInfo: {
        daysRemaining?: number;
        isOverdue?: boolean;
        daysUntilStart?: number;
        canCancel?: boolean;
        daysOverdue?: number;
        [key: string]: string | number | boolean | undefined;
      } = {};
      
      switch (location.status) {
        case 'ACTIVE':
          const daysRemaining = Math.ceil(
            (location.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          timeInfo = {
            daysRemaining: Math.max(0, daysRemaining),
            isOverdue: daysRemaining < 0,
            daysSinceStart: Math.ceil(
              (now.getTime() - location.startDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          };
          break;
          
        case 'PENDING':
          const daysUntilStart = Math.ceil(
            (location.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          timeInfo = {
            daysUntilStart: Math.max(0, daysUntilStart),
            canCancel: daysUntilStart > 1 // Peut annuler si plus de 24h avant
          };
          break;
          
        case 'COMPLETED':
          timeInfo = {
            daysAgo: Math.ceil(
              (now.getTime() - location.endDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          };
          break;
          
        case 'CANCELLED':
          timeInfo = {
            daysSinceCancellation: Math.ceil(
              (now.getTime() - location.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          };
          break;
      }

      // Informations de facturation
      const invoice = location.invoiceItems[0]?.invoice;
      const billingInfo = invoice ? {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        invoiceStatus: invoice.status,
        totalAmount: Number(invoice.totalAmount),
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate,
        isOverdue: invoice.status === 'PENDING' && invoice.dueDate < now
      } : null;

      return {
        id: location.id,
        status: location.status,
        startDate: location.startDate,
        endDate: location.endDate,
        totalPrice: Number(location.totalPrice),
        durationDays,
        notes: location.notes,
        createdAt: location.createdAt,
        updatedAt: location.updatedAt,
        timeInfo,
        materiel: {
          id: location.materiel.id,
          name: location.materiel.name,
          type: location.materiel.type,
          pricePerDay: Number(location.materiel.pricePerDay),
          images: location.materiel.images,
          currentStatus: location.materiel.status
        },
        billing: billingInfo
      };
    });

    // Statistiques rapides
    const stats = {
      total: locations.length,
      active: locations.filter(l => l.status === 'ACTIVE').length,
      pending: locations.filter(l => l.status === 'PENDING').length,
      completed: locations.filter(l => l.status === 'COMPLETED').length,
      cancelled: locations.filter(l => l.status === 'CANCELLED').length
    };

    // Grouper par statut pour une meilleure organisation
    const groupedByStatus = {
      active: enrichedLocations.filter(l => l.status === 'ACTIVE'),
      pending: enrichedLocations.filter(l => l.status === 'PENDING'),
      completed: enrichedLocations.filter(l => l.status === 'COMPLETED'),
      cancelled: enrichedLocations.filter(l => l.status === 'CANCELLED')
    };

    // Alertes basées sur les locations
    const alerts = [];

    // Locations se terminant bientôt
    const endingSoon = enrichedLocations.filter(l => 
      l.status === 'ACTIVE' && 
      typeof l.timeInfo.daysRemaining === 'number' && 
      l.timeInfo.daysRemaining <= 2
    );
    if (endingSoon.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Locations se terminant bientôt',
        message: `${endingSoon.length} location(s) se termine(nt) dans les 2 prochains jours`,
        locations: endingSoon.map(l => ({
          id: l.id,
          materiel: l.materiel.name,
          daysRemaining: l.timeInfo.daysRemaining
        }))
      });
    }

    // Locations en retard
    const overdue = enrichedLocations.filter(l => 
      l.status === 'ACTIVE' && l.timeInfo.isOverdue
    );
    if (overdue.length > 0) {
      alerts.push({
        type: 'error',
        title: 'Locations en retard',
        message: `${overdue.length} location(s) dépassent la date de fin`,
        locations: overdue.map(l => ({
          id: l.id,
          materiel: l.materiel.name,
          daysOverdue: Math.abs(l.timeInfo.daysRemaining || 0)
        }))
      });
    }

    // Factures impayées
    const unpaidInvoices = enrichedLocations.filter(l => 
      l.billing && l.billing.invoiceStatus === 'PENDING'
    );
    if (unpaidInvoices.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Factures en attente',
        message: `${unpaidInvoices.length} facture(s) en attente de paiement`,
        invoices: unpaidInvoices.map(l => ({
          locationId: l.id,
          materiel: l.materiel.name,
          invoiceNumber: l.billing!.invoiceNumber,
          amount: l.billing!.totalAmount,
          dueDate: l.billing!.dueDate
        }))
      });
    }

    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name
        },
        stats,
        locations: enrichedLocations,
        groupedByStatus,
        alerts,
        filters: {
          status: statusFilter,
          limit
        }
      },
      message: `${locations.length} location(s) trouvée(s)`
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur dashboard client recent-locations:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
