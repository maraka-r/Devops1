// API Route pour récupérer les locations à venir
// GET /api/locations/upcoming - Récupérer toutes les locations à venir

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
    const days = parseInt(searchParams.get('days') || '30'); // Prochains X jours
    const materielType = searchParams.get('materielType');
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    // Construire les filtres
    const where: Record<string, unknown> = {
      status: { in: ['PENDING', 'CONFIRMED'] },
      startDate: {
        gte: now,
        lte: futureDate
      }
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
          company: true,
          phone: true
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

    // Récupérer les locations à venir avec pagination
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

    // Calculer les statistiques des locations à venir
    const stats = await prisma.location.aggregate({
      where,
      _count: {
        id: true
      },
      _sum: {
        totalPrice: true
      }
    });

    // Grouper par statut
    const statusStats = await prisma.location.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    });

    // Grouper par semaine
    const weeklyStats = await prisma.location.findMany({
      where,
      select: {
        startDate: true,
        totalPrice: true
      }
    });

    // Calculer les stats par semaine
    const weeklyGrouped = weeklyStats.reduce((acc, location) => {
      const week = Math.floor((location.startDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weekKey = `week_${week}`;
      if (!acc[weekKey]) {
        acc[weekKey] = { count: 0, totalValue: 0 };
      }
      acc[weekKey].count++;
      acc[weekKey].totalValue += Number(location.totalPrice);
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    return NextResponse.json({
      success: true,
      data: {
        locations,
        stats: {
          totalUpcoming: stats._count.id,
          totalValue: stats._sum.totalPrice || 0,
          byStatus: statusStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
          }, {} as Record<string, number>),
          byWeek: weeklyGrouped
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
    console.error('Erreur lors de la récupération des locations à venir:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des locations à venir'
    }, { status: 500 });
  }
}
