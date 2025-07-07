// API Route pour récupérer l'historique des locations
// GET /api/locations/history - Récupérer l'historique des locations terminées et annulées

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implémenter l'authentification
    const isAuthenticated = true; // Placeholder
    const userId = 'user-id'; // Placeholder
    const isAdmin = true; // Placeholder
    
    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination et filtres
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // COMPLETED ou CANCELLED
    const materielType = searchParams.get('materielType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'endDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construire les filtres
    const where: Record<string, unknown> = {
      status: status ? status : { in: ['COMPLETED', 'CANCELLED'] }
    };

    // Filtrer par utilisateur si pas admin
    if (!isAdmin) {
      where.userId = userId;
    }

    // Filtrer par dates si spécifiées
    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.endDate = dateFilter;
    }

    // Inclure les filtres des relations
    const include: Record<string, unknown> = {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true
        }
      },
      materiel: {
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          pricePerDay: true,
          images: true
        }
      }
    };

    // Filtrer par type de matériel si spécifié
    if (materielType) {
      where.materiel = {
        type: materielType
      };
    }

    // Récupérer l'historique avec pagination
    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include,
        orderBy: {
          [sortBy]: sortOrder as 'asc' | 'desc'
        }
      }),
      prisma.location.count({ where })
    ]);

    // Calculer les statistiques de l'historique
    const stats = await prisma.location.aggregate({
      where: { status: { in: ['COMPLETED', 'CANCELLED'] } },
      _count: {
        id: true
      },
      _sum: {
        totalPrice: true
      }
    });

    // Statistiques par statut
    const statusStats = await prisma.location.groupBy({
      by: ['status'],
      where: { status: { in: ['COMPLETED', 'CANCELLED'] } },
      _count: {
        id: true
      },
      _sum: {
        totalPrice: true
      }
    });

    // Statistiques mensuelles pour les 12 derniers mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyStats = await prisma.location.findMany({
      where: {
        status: { in: ['COMPLETED', 'CANCELLED'] },
        endDate: { gte: twelveMonthsAgo }
      },
      select: {
        endDate: true,
        totalPrice: true,
        status: true
      }
    });

    // Grouper par mois
    const monthlyGrouped = monthlyStats.reduce((acc, location) => {
      const monthKey = `${location.endDate.getFullYear()}-${String(location.endDate.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { completed: 0, cancelled: 0, totalValue: 0 };
      }
      if (location.status === 'COMPLETED') {
        acc[monthKey].completed++;
        acc[monthKey].totalValue += Number(location.totalPrice);
      } else if (location.status === 'CANCELLED') {
        acc[monthKey].cancelled++;
      }
      return acc;
    }, {} as Record<string, { completed: number; cancelled: number; totalValue: number }>);

    // Top matériels les plus loués
    const topMaterials = await prisma.location.groupBy({
      by: ['materielId'],
      where: { status: 'COMPLETED' },
      _count: {
        id: true
      },
      _sum: {
        totalPrice: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Récupérer les détails des top matériels
    const topMaterialsWithDetails = await Promise.all(
      topMaterials.map(async (material) => {
        const details = await prisma.materiel.findUnique({
          where: { id: material.materielId },
          select: {
            id: true,
            name: true,
            type: true
          }
        });
        return {
          ...details,
          locationCount: material._count.id,
          totalRevenue: material._sum.totalPrice || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        locations,
        stats: {
          totalHistorical: stats._count.id,
          totalValue: stats._sum.totalPrice || 0,
          byStatus: statusStats.reduce((acc, stat) => {
            acc[stat.status] = {
              count: stat._count.id,
              value: Number(stat._sum.totalPrice) || 0
            };
            return acc;
          }, {} as Record<string, { count: number; value: number }>),
          byMonth: monthlyGrouped,
          topMaterials: topMaterialsWithDetails
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    }, { status: 500 });
  }
}
