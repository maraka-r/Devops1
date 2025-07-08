// API Route générale pour le dashboard
// GET /api/dashboard - Toutes les données du dashboard en une seule requête

import { NextResponse } from 'next/server';
import { withErrorHandler, withMethodValidation, withAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import prisma from '@/lib/db';

/**
 * Handler pour récupérer toutes les données du dashboard
 */
const dashboardHandler = async (): Promise<NextResponse> => {
  try {
    const now = new Date();
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Récupérer toutes les données en parallèle
    const [
      totalUsers,
      totalMateriels,
      totalLocations,
      activeLocations,
      materielsAvailable,
      materielsRented,
      materielsMaintenance,
      monthlyRevenue,
      overdueRentals,
      upcomingDeadlines,
      maintenanceNeeded,
      recentLocations,
      newClientsCount,
      completedLocationsCount
    ] = await Promise.all([
      // Statistiques
      prisma.user.count(),
      prisma.materiel.count(),
      prisma.location.count(),
      prisma.location.count({ where: { status: 'ACTIVE' } }),
      prisma.materiel.count({ where: { status: 'AVAILABLE' } }),
      prisma.materiel.count({ where: { status: 'RENTED' } }),
      prisma.materiel.count({ where: { status: 'MAINTENANCE' } }),
      prisma.location.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          },
          status: { in: ['ACTIVE', 'COMPLETED'] }
        }
      }),
      
      // Alertes
      prisma.location.count({
        where: { endDate: { lt: now }, status: 'ACTIVE' }
      }),
      prisma.location.count({
        where: { endDate: { gte: now, lte: nextWeek }, status: 'ACTIVE' }
      }),
      prisma.materiel.count({ where: { status: 'MAINTENANCE' } }),
      
      // Activité récente
      prisma.location.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, company: true }
          },
          materiel: {
            select: { id: true, name: true, type: true, pricePerDay: true }
          }
        }
      }),
      prisma.user.count({
        where: { createdAt: { gte: last30Days }, role: 'USER' }
      }),
      prisma.location.count({
        where: { updatedAt: { gte: last30Days }, status: 'COMPLETED' }
      })
    ]);

    // Construire la réponse complète
    const dashboardData = {
      stats: {
        totalUsers,
        totalMateriels,
        totalLocations,
        activeLocations,
        monthlyRevenue: Number(monthlyRevenue._sum.totalPrice || 0),
        materiels: {
          available: materielsAvailable,
          rented: materielsRented,
          maintenance: materielsMaintenance
        }
      },
      alerts: {
        overdueRentals,
        upcomingDeadlines,
        maintenanceNeeded,
        lowStock: materielsMaintenance // Utilisation de maintenanceNeeded comme indicateur de stock faible
      },
      recentActivity: {
        locations: recentLocations,
        newClients: newClientsCount,
        completedLocations: completedLocationsCount
      }
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      message: 'Données du dashboard récupérées avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des données du dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
};

// Appliquer les middlewares
const handler = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['GET'], handler),
  withAuth
)(dashboardHandler);

export { handler as GET };
