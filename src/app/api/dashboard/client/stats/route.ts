import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/client/stats
 * Statistiques détaillées du client
 * 
 * @description Fournit des statistiques détaillées pour un client spécifique :
 * - Historique des locations (par mois, par type de matériel)
 * - Répartition des dépenses
 * - Taux d'utilisation et fidélité
 * - Comparaison avec la moyenne des clients
 * 
 * @param {string} userId - ID de l'utilisateur (query parameter)
 * @param {string} period - Période d'analyse (optional: '3months', '6months', '1year', 'all')
 * @returns {Object} Statistiques détaillées du client
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '6months';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId est requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Calculer la date de début selon la période
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case 'all':
        startDate = user.createdAt;
        break;
      default: // 6months
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }

    // Statistiques générales sur la période
    const [
      totalLocations,
      completedLocations,
      cancelledLocations,
      totalSpent,
      averageLocationDuration,
      uniqueMaterialsRented
    ] = await Promise.all([
      // Total des locations sur la période
      prisma.location.count({
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      }),
      // Locations terminées
      prisma.location.count({
        where: {
          userId,
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        }
      }),
      // Locations annulées
      prisma.location.count({
        where: {
          userId,
          status: 'CANCELLED',
          createdAt: { gte: startDate }
        }
      }),
      // Total dépensé
      prisma.location.aggregate({
        where: {
          userId,
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { totalPrice: true }
      }),
      // Durée moyenne des locations
      prisma.location.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        select: {
          startDate: true,
          endDate: true
        }
      }),
      // Nombre de matériels uniques loués
      prisma.location.groupBy({
        by: ['materielId'],
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      })
    ]);

    // Calculer la durée moyenne des locations
    const avgDuration = averageLocationDuration.length > 0 
      ? averageLocationDuration.reduce((sum, loc) => {
          const duration = (loc.endDate.getTime() - loc.startDate.getTime()) / (1000 * 60 * 60 * 24);
          return sum + duration;
        }, 0) / averageLocationDuration.length
      : 0;

    // Locations par mois
    const locationsByMonth = await prisma.location.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      _sum: { totalPrice: true }
    });

    // Répartition par type de matériel
    const locationsByMaterialType = await prisma.location.groupBy({
      by: ['materielId'],
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      _sum: { totalPrice: true }
    });

    // Récupérer les détails des matériels pour la répartition
    const materialDetails = await Promise.all(
      locationsByMaterialType.map(async (group) => {
        const materiel = await prisma.materiel.findUnique({
          where: { id: group.materielId },
          select: { name: true, type: true }
        });
        return {
          ...group,
          materiel
        };
      })
    );

    // Répartition par type
    const typeStats = materialDetails.reduce((acc, item) => {
      const type = item.materiel?.type || 'UNKNOWN';
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalSpent: 0,
          materials: []
        };
      }
      acc[type].count += item._count.id;
      acc[type].totalSpent += Number(item._sum.totalPrice || 0);
      acc[type].materials.push(item.materiel?.name || 'Inconnu');
      return acc;
    }, {} as Record<string, { count: number; totalSpent: number; materials: string[] }>);

    // Comparaison avec la moyenne des clients
    const [avgClientLocations, avgClientSpending] = await Promise.all([
      // Moyenne des locations par client
      prisma.location.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      }),
      // Moyenne des dépenses par client
      prisma.location.groupBy({
        by: ['userId'],
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { totalPrice: true }
      })
    ]);

    const avgLocationsPerClient = avgClientLocations.length > 0
      ? avgClientLocations.reduce((sum, client) => sum + client._count.id, 0) / avgClientLocations.length
      : 0;

    const avgSpendingPerClient = avgClientSpending.length > 0
      ? avgClientSpending.reduce((sum, client) => sum + Number(client._sum.totalPrice || 0), 0) / avgClientSpending.length
      : 0;

    // Calculs de performance
    const completionRate = totalLocations > 0 ? (completedLocations / totalLocations) * 100 : 0;
    const cancellationRate = totalLocations > 0 ? (cancelledLocations / totalLocations) * 100 : 0;
    const averageOrderValue = completedLocations > 0 ? Number(totalSpent._sum.totalPrice || 0) / completedLocations : 0;

    // Tendances mensuelles
    const monthlyTrends = locationsByMonth.reduce((acc, record) => {
      const month = new Date(record.createdAt).toLocaleString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      });
      acc[month] = {
        locations: record._count.id,
        spending: Number(record._sum.totalPrice || 0)
      };
      return acc;
    }, {} as Record<string, { locations: number; spending: number }>);

    // Matériels favoris (les plus loués)
    const topMaterials = materialDetails
      .sort((a, b) => b._count.id - a._count.id)
      .slice(0, 5)
      .map(item => ({
        material: item.materiel?.name || 'Inconnu',
        type: item.materiel?.type || 'UNKNOWN',
        count: item._count.id,
        totalSpent: Number(item._sum.totalPrice || 0)
      }));

    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          memberSince: user.createdAt,
          role: user.role
        },
        period: {
          type: period,
          startDate,
          endDate: now
        },
        summary: {
          totalLocations,
          completedLocations,
          cancelledLocations,
          totalSpent: Number(totalSpent._sum.totalPrice || 0),
          averageOrderValue,
          averageLocationDuration: Math.round(avgDuration * 10) / 10,
          uniqueMaterialsRented: uniqueMaterialsRented.length,
          completionRate: Math.round(completionRate * 10) / 10,
          cancellationRate: Math.round(cancellationRate * 10) / 10
        },
        performance: {
          vsAverageClient: {
            locations: totalLocations - avgLocationsPerClient,
            spending: Number(totalSpent._sum.totalPrice || 0) - avgSpendingPerClient,
            locationsPercentage: avgLocationsPerClient > 0 
              ? Math.round(((totalLocations / avgLocationsPerClient) - 1) * 100)
              : 0,
            spendingPercentage: avgSpendingPerClient > 0 
              ? Math.round(((Number(totalSpent._sum.totalPrice || 0) / avgSpendingPerClient) - 1) * 100)
              : 0
          }
        },
        breakdown: {
          byType: Object.entries(typeStats).map(([type, stats]) => ({
            type,
            count: stats.count,
            totalSpent: stats.totalSpent,
            percentage: totalLocations > 0 ? Math.round((stats.count / totalLocations) * 100) : 0,
            uniqueMaterials: [...new Set(stats.materials)].length
          })),
          topMaterials,
          monthlyTrends: Object.entries(monthlyTrends).map(([month, data]) => ({
            month,
            locations: data.locations,
            spending: data.spending
          }))
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur dashboard client stats:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
