import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

/**
 * GET /api/dashboard/admin/top-clients
 * Retourne les meilleurs clients par revenus ou activité
 * Query params:
 * - limit: nombre maximum de résultats (default: 10)
 * - period: 'week', 'month', 'quarter', 'year', 'all' (default: 'month')
 * - sortBy: 'revenue', 'locations', 'recent' (default: 'revenue')
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Vérifier l'authentification et les permissions admin
    // const authUser = await getCurrentUser();
    // if (!authUser || authUser.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Accès refusé. Permissions administrateur requises.' },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || 'month';
    const sortBy = searchParams.get('sortBy') || 'revenue';

    const now = new Date();
    let startDate: Date | null = null;

    // Déterminer la date de début selon la période
    if (period !== 'all') {
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
      }
    }

    // Construire la condition de date
    const dateCondition = startDate ? {
      createdAt: {
        gte: startDate,
        lte: now
      }
    } : {};

    // Récupérer les utilisateurs avec leurs locations et factures
    const users = await prisma.user.findMany({
      where: {
        role: 'USER' // Exclure les admins
      },
      include: {
        locations: {
          where: dateCondition,
          include: {
            materiel: true,
            invoiceItems: {
              include: {
                invoice: true
              }
            }
          }
        },
        invoices: {
          where: {
            ...dateCondition,
            status: 'PAID'
          }
        }
      }
    });

    // Calculer les statistiques par client
    const clientStats = users.map(user => {
      const locations = user.locations;
      const invoices = user.invoices;

      // Calculer le revenu total
      const totalRevenue = invoices.reduce((sum, invoice) => {
        return sum + Number(invoice.totalAmount);
      }, 0);

      // Calculer le nombre de jours de location
      const totalDays = locations.reduce((sum, location) => {
        const days = Math.ceil((location.endDate.getTime() - location.startDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);

      // Trouver la dernière location
      const lastLocation = locations.reduce((latest, location) => {
        return !latest || location.createdAt > latest.createdAt ? location : latest;
      }, null as typeof locations[0] | null);

      // Calculer les types de matériel utilisés
      const materialTypes = [...new Set(locations.map(loc => loc.materiel.type))];

      // Calculer la fréquence de location (locations par mois)
      const monthsInPeriod = startDate 
        ? Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
        : Math.max(1, Math.ceil((now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));

      const locationFrequency = locations.length / monthsInPeriod;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
        memberSince: user.createdAt,
        stats: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalLocations: locations.length,
          totalDays: totalDays,
          averageOrderValue: locations.length > 0 
            ? Math.round((totalRevenue / locations.length) * 100) / 100
            : 0,
          locationFrequency: Math.round(locationFrequency * 100) / 100,
          materialTypesUsed: materialTypes.length,
          lastActivity: lastLocation ? lastLocation.createdAt : user.createdAt,
          preferredMaterials: materialTypes.slice(0, 3), // Top 3 types
          activeLocations: locations.filter(loc => loc.status === 'ACTIVE').length,
          completedLocations: locations.filter(loc => loc.status === 'COMPLETED').length
        }
      };
    });

    // Filtrer les clients qui ont eu de l'activité dans la période
    const activeClients = clientStats.filter(client => 
      client.stats.totalLocations > 0 || period === 'all'
    );

    // Trier selon le critère demandé
    const sortedClients = activeClients.sort((a, b) => {
      switch (sortBy) {
        case 'locations':
          return b.stats.totalLocations - a.stats.totalLocations;
        case 'recent':
          return b.stats.lastActivity.getTime() - a.stats.lastActivity.getTime();
        case 'revenue':
        default:
          return b.stats.totalRevenue - a.stats.totalRevenue;
      }
    });

    // Prendre les N premiers résultats
    const topClients = sortedClients.slice(0, limit);

    // Calculer les statistiques globales
    const totalRevenue = activeClients.reduce((sum, client) => sum + client.stats.totalRevenue, 0);
    const totalLocations = activeClients.reduce((sum, client) => sum + client.stats.totalLocations, 0);
    const topClientShare = totalRevenue > 0 && topClients.length > 0
      ? Math.round((topClients[0].stats.totalRevenue / totalRevenue) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        clients: topClients.map(client => ({
          ...client,
          memberSince: formatDate(client.memberSince),
          stats: {
            ...client.stats,
            lastActivity: formatDate(client.stats.lastActivity)
          }
        })),
        summary: {
          period,
          sortBy,
          totalActiveClients: activeClients.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalLocations,
          averageRevenuePerClient: activeClients.length > 0 
            ? Math.round((totalRevenue / activeClients.length) * 100) / 100
            : 0,
          topClientShare,
          clientRetentionRate: users.length > 0 
            ? Math.round((activeClients.length / users.length) * 100)
            : 0
        },
        metadata: {
          startDate: startDate ? formatDate(startDate) : null,
          endDate: formatDate(now),
          limit,
          generatedAt: formatDate(now)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des meilleurs clients:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
