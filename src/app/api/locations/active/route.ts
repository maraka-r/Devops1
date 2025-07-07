// API Route pour récupérer les locations actives
// GET /api/locations/active - Récupérer toutes les locations actives

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
    const materielType = searchParams.get('materielType');
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Construire les filtres
    const where: Record<string, unknown> = {
      status: 'ACTIVE'
    };

    // Filtrer par utilisateur si pas admin
    if (!isAdmin) {
      where.userId = userId;
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

    // Récupérer les locations actives avec pagination
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

    // Calculer les statistiques des locations actives
    const stats = await prisma.location.aggregate({
      where: { status: 'ACTIVE' },
      _count: {
        id: true
      },
      _sum: {
        totalPrice: true
      }
    });

    // Grouper par type de matériel
    const materialStats = await prisma.location.findMany({
      where: { status: 'ACTIVE' },
      select: {
        materiel: {
          select: {
            type: true
          }
        }
      }
    });

    const materialTypeCounts = materialStats.reduce((acc, location) => {
      const type = location.materiel.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        locations,
        stats: {
          totalActive: stats._count.id,
          totalValue: stats._sum.totalPrice || 0,
          byMaterialType: materialTypeCounts
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
    console.error('Erreur lors de la récupération des locations actives:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des locations actives'
    }, { status: 500 });
  }
}
