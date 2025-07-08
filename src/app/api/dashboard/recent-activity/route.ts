// API Route pour l'activité récente du dashboard
// GET /api/dashboard/recent-activity - Activité récente et données importantes

import { NextResponse } from 'next/server';
import { withErrorHandler, withMethodValidation, withAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import prisma from '@/lib/db';

/**
 * Handler pour récupérer l'activité récente
 */
const recentActivityHandler = async (): Promise<NextResponse> => {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Récupérer les données en parallèle
    const [
      recentLocations,
      newClientsCount,
      completedLocationsCount
    ] = await Promise.all([
      // Les 10 dernières locations avec détails
      prisma.location.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
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
              pricePerDay: true
            }
          }
        }
      }),
      
      // Nouveaux clients dans les 30 derniers jours
      prisma.user.count({
        where: {
          createdAt: {
            gte: last30Days
          },
          role: 'USER'
        }
      }),
      
      // Locations terminées dans les 30 derniers jours
      prisma.location.count({
        where: {
          updatedAt: {
            gte: last30Days
          },
          status: 'COMPLETED'
        }
      })
    ]);

    // Construire la réponse
    const recentActivity = {
      locations: recentLocations,
      newClients: newClientsCount,
      completedLocations: completedLocationsCount
    };

    return NextResponse.json({
      success: true,
      data: recentActivity,
      message: 'Activité récente récupérée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité récente:', error);
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
)(recentActivityHandler);

export { handler as GET };
