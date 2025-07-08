// API Route pour les alertes du dashboard
// GET /api/dashboard/alerts - Alertes et notifications importantes

import { NextResponse } from 'next/server';
import { withErrorHandler, withMethodValidation, withAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import prisma from '@/lib/db';

/**
 * Handler pour récupérer les alertes du dashboard
 */
const alertsHandler = async (): Promise<NextResponse> => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Récupérer les alertes en parallèle
    const [
      overdueRentals,
      upcomingDeadlines,
      maintenanceNeeded,
      lowStock
    ] = await Promise.all([
      // Locations en retard (dépassant la date de fin)
      prisma.location.count({
        where: {
          endDate: {
            lt: now
          },
          status: 'ACTIVE'
        }
      }),
      
      // Échéances dans les 7 prochains jours
      prisma.location.count({
        where: {
          endDate: {
            gte: now,
            lte: nextWeek
          },
          status: 'ACTIVE'
        }
      }),
      
      // Matériels nécessitant une maintenance
      prisma.materiel.count({
        where: {
          status: 'MAINTENANCE'
        }
      }),
      
      // Stock faible (pour l'instant, on compte les matériels indisponibles)
      prisma.materiel.count({
        where: {
          status: {
            not: 'AVAILABLE'
          }
        }
      })
    ]);

    // Construire la réponse
    const alerts = {
      overdueRentals,
      upcomingDeadlines,
      maintenanceNeeded,
      lowStock
    };

    return NextResponse.json({
      success: true,
      data: alerts,
      message: 'Alertes récupérées avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
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
)(alertsHandler);

export { handler as GET };
