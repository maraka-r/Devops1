import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/client/spending
 * Analyse des dépenses du client
 * 
 * @description Fournit une analyse détaillée des dépenses d'un client :
 * - Évolution des dépenses dans le temps
 * - Répartition par type de matériel
 * - Comparaison avec la moyenne des clients
 * - Projections et recommandations d'économies
 * - Analyse de rentabilité vs achat
 * 
 * @param {string} userId - ID de l'utilisateur (query parameter)
 * @param {string} period - Période d'analyse (optional: '3months', '6months', '1year', '2years', 'all')
 * @param {string} groupBy - Groupement (optional: 'month', 'quarter', 'year')
 * @returns {Object} Analyse complète des dépenses
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '1year';
    const groupBy = searchParams.get('groupBy') || 'month';

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
        company: true
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
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '2years':
        startDate = new Date(now.getFullYear() - 2, now.getMonth(), 1);
        break;
      case 'all':
        startDate = user.createdAt;
        break;
      default: // 1year
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    }

    // Récupérer toutes les locations terminées (payées) dans la période
    const completedLocations = await prisma.location.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerDay: true
          }
        },
        invoiceItems: {
          include: {
            invoice: {
              select: {
                status: true,
                totalAmount: true,
                paidDate: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Statistiques générales
    const totalSpent = completedLocations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
    const totalLocations = completedLocations.length;
    const averageOrderValue = totalLocations > 0 ? totalSpent / totalLocations : 0;

    // Calcul des jours totaux de location
    const totalRentalDays = completedLocations.reduce((sum, loc) => {
      const days = Math.ceil((loc.endDate.getTime() - loc.startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    const averageDailySpending = totalRentalDays > 0 ? totalSpent / totalRentalDays : 0;

    // Groupement temporel
    const spendingByPeriod = new Map<string, number>();
    const locationsByPeriod = new Map<string, number>();

    completedLocations.forEach(location => {
      let periodKey: string;
      const date = new Date(location.createdAt);
      
      switch (groupBy) {
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          periodKey = date.getFullYear().toString();
          break;
        default: // month
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      spendingByPeriod.set(periodKey, (spendingByPeriod.get(periodKey) || 0) + Number(location.totalPrice));
      locationsByPeriod.set(periodKey, (locationsByPeriod.get(periodKey) || 0) + 1);
    });

    // Répartition par type de matériel
    const spendingByType = new Map<string, { 
      total: number; 
      count: number; 
      materials: Set<string>;
      averagePrice: number;
    }>();

    completedLocations.forEach(location => {
      const type = location.materiel.type;
      const current = spendingByType.get(type) || { 
        total: 0, 
        count: 0, 
        materials: new Set(),
        averagePrice: 0
      };
      
      current.total += Number(location.totalPrice);
      current.count += 1;
      current.materials.add(location.materiel.name);
      current.averagePrice = current.total / current.count;
      
      spendingByType.set(type, current);
    });

    // Matériels les plus coûteux
    const materialSpending = new Map<string, {
      id: string;
      name: string;
      type: string;
      totalSpent: number;
      locationCount: number;
      averageSpent: number;
      lastRented: Date;
    }>();

    completedLocations.forEach(location => {
      const id = location.materiel.id;
      const current = materialSpending.get(id) || {
        id,
        name: location.materiel.name,
        type: location.materiel.type,
        totalSpent: 0,
        locationCount: 0,
        averageSpent: 0,
        lastRented: location.createdAt
      };

      current.totalSpent += Number(location.totalPrice);
      current.locationCount += 1;
      current.averageSpent = current.totalSpent / current.locationCount;
      if (location.createdAt > current.lastRented) {
        current.lastRented = location.createdAt;
      }

      materialSpending.set(id, current);
    });

    const topSpendingMaterials = Array.from(materialSpending.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Comparaison avec la moyenne des clients
    const [avgClientSpending, avgClientLocations] = await Promise.all([
      prisma.location.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _avg: { totalPrice: true }
      }),
      prisma.location.groupBy({
        by: ['userId'],
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { totalPrice: true },
        _count: { id: true }
      })
    ]);

    const avgOrderValueAllClients = Number(avgClientSpending._avg.totalPrice || 0);
    const avgSpendingPerClient = avgClientLocations.length > 0
      ? avgClientLocations.reduce((sum, client) => sum + Number(client._sum.totalPrice || 0), 0) / avgClientLocations.length
      : 0;

    // Tendances et projections
    const periodEntries = Array.from(spendingByPeriod.entries()).sort();
    const trends = {
      isIncreasing: false,
      growthRate: 0,
      projection: {
        nextPeriod: 0,
        nextYear: 0
      }
    };

    if (periodEntries.length >= 2) {
      const firstPeriod = Number(periodEntries[0][1]);
      const lastPeriod = Number(periodEntries[periodEntries.length - 1][1]);
      trends.growthRate = firstPeriod > 0 ? ((lastPeriod - firstPeriod) / firstPeriod) * 100 : 0;
      trends.isIncreasing = lastPeriod > firstPeriod;
      
      // Projection simple basée sur la tendance moyenne
      const avgGrowth = trends.growthRate / 100;
      trends.projection.nextPeriod = lastPeriod * (1 + avgGrowth);
      trends.projection.nextYear = totalSpent * (1 + avgGrowth);
    }

    // Analyse de rentabilité vs achat
    const rentabilityAnalysis = topSpendingMaterials.slice(0, 5).map(material => {
      // Estimation du prix d'achat (approximation: 200-500 fois le prix journalier)
      const estimatedPurchasePrice = {
        low: Number(completedLocations.find(l => l.materiel.id === material.id)?.materiel.pricePerDay || 0) * 200,
        high: Number(completedLocations.find(l => l.materiel.id === material.id)?.materiel.pricePerDay || 0) * 500
      };

      const breakEvenDays = {
        low: estimatedPurchasePrice.low / Number(completedLocations.find(l => l.materiel.id === material.id)?.materiel.pricePerDay || 1),
        high: estimatedPurchasePrice.high / Number(completedLocations.find(l => l.materiel.id === material.id)?.materiel.pricePerDay || 1)
      };

      return {
        material: {
          id: material.id,
          name: material.name,
          type: material.type
        },
        rental: {
          totalSpent: material.totalSpent,
          daysRented: completedLocations
            .filter(l => l.materiel.id === material.id)
            .reduce((sum, l) => sum + Math.ceil((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24)), 0)
        },
        purchase: {
          estimatedPrice: estimatedPurchasePrice,
          breakEvenDays: breakEvenDays,
          wouldBeProfitable: material.totalSpent > estimatedPurchasePrice.low
        }
      };
    });

    // Recommandations d'économies
    const recommendations = [];

    // Recommandation basée sur la fréquence d'utilisation
    const frequentMaterials = topSpendingMaterials.filter(m => m.locationCount >= 3);
    if (frequentMaterials.length > 0) {
      recommendations.push({
        type: 'frequency',
        title: 'Matériels fréquemment loués',
        message: `Vous avez loué ${frequentMaterials.length} type(s) de matériel plus de 3 fois. Considérez l'achat.`,
        materials: frequentMaterials.slice(0, 3).map(m => ({
          name: m.name,
          count: m.locationCount,
          totalSpent: m.totalSpent
        })),
        potentialSavings: frequentMaterials.reduce((sum, m) => sum + (m.totalSpent * 0.3), 0) // Estimation 30% d'économie
      });
    }

    // Recommandation basée sur les locations longues
    const longRentals = completedLocations.filter(l => {
      const days = Math.ceil((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 30;
    });

    if (longRentals.length > 0) {
      recommendations.push({
        type: 'duration',
        title: 'Locations de longue durée',
        message: `${longRentals.length} location(s) ont duré plus de 30 jours. Négociez des tarifs préférentiels.`,
        locations: longRentals.slice(0, 3).map(l => ({
          material: l.materiel.name,
          duration: Math.ceil((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24)),
          cost: Number(l.totalPrice)
        }))
      });
    }

    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          company: user.company,
          memberSince: user.createdAt
        },
        period: {
          type: period,
          groupBy,
          startDate,
          endDate: now
        },
        summary: {
          totalSpent,
          totalLocations,
          totalRentalDays,
          averageOrderValue,
          averageDailySpending,
          spentThisPeriod: totalSpent
        },
        trends: {
          ...trends,
          spendingByPeriod: periodEntries.map(([period, amount]) => ({
            period,
            amount,
            locations: locationsByPeriod.get(period) || 0
          }))
        },
        breakdown: {
          byType: Array.from(spendingByType.entries()).map(([type, data]) => ({
            type,
            totalSpent: data.total,
            locationCount: data.count,
            uniqueMaterials: data.materials.size,
            averageSpent: data.averagePrice,
            percentage: totalSpent > 0 ? Math.round((data.total / totalSpent) * 100) : 0
          })).sort((a, b) => b.totalSpent - a.totalSpent),
          topMaterials: topSpendingMaterials
        },
        comparison: {
          vsAverageClient: {
            totalSpending: totalSpent - avgSpendingPerClient,
            averageOrderValue: averageOrderValue - avgOrderValueAllClients,
            spendingPercentage: avgSpendingPerClient > 0 
              ? Math.round(((totalSpent / avgSpendingPerClient) - 1) * 100)
              : 0,
            orderValuePercentage: avgOrderValueAllClients > 0 
              ? Math.round(((averageOrderValue / avgOrderValueAllClients) - 1) * 100)
              : 0
          }
        },
        rentabilityAnalysis,
        recommendations
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur dashboard client spending:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
