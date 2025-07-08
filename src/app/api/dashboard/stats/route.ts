// API Route pour les statistiques générales du dashboard
// GET /api/dashboard/stats - Statistiques générales

import { NextResponse } from 'next/server';
import { withErrorHandler, withMethodValidation, withAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import prisma from '@/lib/db';

/**
 * Handler pour récupérer les statistiques générales du dashboard
 */
const statsHandler = async (): Promise<NextResponse> => {
  try {
    // Récupérer les statistiques en parallèle
    const [
      totalUsers,
      totalMateriels,
      totalLocations,
      activeLocations,
      materielsAvailable,
      materielsRented,
      materielsMaintenance,
      monthlyRevenue
    ] = await Promise.all([
      // Nombre total d'utilisateurs
      prisma.user.count(),
      
      // Nombre total de matériels
      prisma.materiel.count(),
      
      // Nombre total de locations
      prisma.location.count(),
      
      // Nombre de locations actives
      prisma.location.count({
        where: {
          status: 'ACTIVE'
        }
      }),
      
      // Matériels disponibles
      prisma.materiel.count({
        where: {
          status: 'AVAILABLE'
        }
      }),
      
      // Matériels en location
      prisma.materiel.count({
        where: {
          status: 'RENTED'
        }
      }),
      
      // Matériels en maintenance
      prisma.materiel.count({
        where: {
          status: 'MAINTENANCE'
        }
      }),
      
      // Revenus du mois en cours
      prisma.location.aggregate({
        _sum: {
          totalPrice: true
        },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          },
          status: {
            in: ['ACTIVE', 'COMPLETED']
          }
        }
      })
    ]);

    // Construire la réponse
    const stats = {
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
    };

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Statistiques récupérées avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
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
)(statsHandler);

export { handler as GET };
