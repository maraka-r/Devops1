import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

/**
 * GET /api/dashboard/admin/popular-materials
 * Retourne les matériels les plus populaires/rentables
 * Query params:
 * - limit: nombre maximum de résultats (default: 10)
 * - period: 'week', 'month', 'quarter', 'year' (default: 'month')
 * - sortBy: 'locations', 'revenue', 'usage' (default: 'locations')
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
    const sortBy = searchParams.get('sortBy') || 'locations';

    const now = new Date();
    let startDate: Date;

    // Déterminer la date de début selon la période
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

    // Récupérer les locations dans la période avec les matériels et factures
    const locations = await prisma.location.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        materiel: true,
        invoiceItems: {
          include: {
            invoice: true
          }
        }
      }
    });

    // Calculer les statistiques par matériel
    const materialStats: { [key: string]: {
      id: string;
      name: string;
      type: string;
      pricePerDay: number;
      locationsCount: number;
      totalRevenue: number;
      totalDays: number;
      averageRating: number;
      utilizationRate: number;
      lastRented: Date | null;
    }} = {};

    locations.forEach(location => {
      const materialId = location.materiel.id;
      const materialKey = materialId;

      if (!materialStats[materialKey]) {
        materialStats[materialKey] = {
          id: location.materiel.id,
          name: location.materiel.name,
          type: location.materiel.type,
          pricePerDay: Number(location.materiel.pricePerDay),
          locationsCount: 0,
          totalRevenue: 0,
          totalDays: 0,
          averageRating: 0, // TODO: Implémenter le système de notation
          utilizationRate: 0,
          lastRented: null
        };
      }

      const stats = materialStats[materialKey];
      stats.locationsCount++;

      // Calculer les jours de location
      const days = Math.ceil((location.endDate.getTime() - location.startDate.getTime()) / (1000 * 60 * 60 * 24));
      stats.totalDays += days;

      // Calculer le revenu total
      const revenue = location.invoiceItems.reduce((sum, item) => {
        if (item.invoice.status === 'PAID') {
          return sum + Number(item.totalPrice);
        }
        return sum;
      }, 0);
      stats.totalRevenue += revenue;

      // Mettre à jour la dernière location
      if (!stats.lastRented || location.createdAt > stats.lastRented) {
        stats.lastRented = location.createdAt;
      }
    });

    // Calculer le taux d'utilisation pour chaque matériel
    const totalDaysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    Object.values(materialStats).forEach(stats => {
      stats.utilizationRate = Math.round((stats.totalDays / totalDaysInPeriod) * 100);
    });

    // Trier selon le critère demandé
    const sortedMaterials = Object.values(materialStats).sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'usage':
          return b.totalDays - a.totalDays;
        case 'locations':
        default:
          return b.locationsCount - a.locationsCount;
      }
    });

    // Prendre les N premiers résultats
    const topMaterials = sortedMaterials.slice(0, limit);

    // Calculer les statistiques globales
    const totalMaterials = await prisma.materiel.count();
    const totalLocationsInPeriod = locations.length;
    const totalRevenueInPeriod = Object.values(materialStats).reduce(
      (sum, stats) => sum + stats.totalRevenue, 0
    );

    return NextResponse.json({
      success: true,
      data: {
        materials: topMaterials.map(material => ({
          ...material,
          pricePerDay: Math.round(material.pricePerDay * 100) / 100,
          totalRevenue: Math.round(material.totalRevenue * 100) / 100,
          averageRevenuePerDay: material.totalDays > 0 
            ? Math.round((material.totalRevenue / material.totalDays) * 100) / 100
            : 0,
          lastRented: material.lastRented ? formatDate(material.lastRented) : null
        })),
        summary: {
          period,
          sortBy,
          totalMaterials,
          totalLocationsInPeriod,
          totalRevenueInPeriod: Math.round(totalRevenueInPeriod * 100) / 100,
          averageLocationsPerMaterial: totalMaterials > 0 
            ? Math.round((totalLocationsInPeriod / totalMaterials) * 100) / 100
            : 0,
          topMaterialShare: totalLocationsInPeriod > 0 && topMaterials.length > 0
            ? Math.round((topMaterials[0].locationsCount / totalLocationsInPeriod) * 100)
            : 0
        },
        metadata: {
          startDate: formatDate(startDate),
          endDate: formatDate(now),
          limit,
          generatedAt: formatDate(now)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des matériels populaires:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
