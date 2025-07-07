// API Route pour la gestion des favoris utilisateur
// GET /api/users/favorites - Récupérer les favoris de l'utilisateur connecté

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withMethodValidation, withAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import { handlePrismaError } from '@/lib/utils';
import prisma from '@/lib/db';

/**
 * Handler pour récupérer les favoris de l'utilisateur connecté
 */
const getUserFavoritesHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // L'ID utilisateur est injecté par le middleware withAuth
    const userId = (req as NextRequest & { user: { userId: string } }).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // Paramètres de pagination optionnels
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Récupérer les favoris avec les informations du matériel
    const [favoris, total] = await Promise.all([
      prisma.favori.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          materiel: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
              pricePerDay: true,
              status: true,
              images: true,
              _count: {
                select: {
                  locations: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.favori.count({
        where: { userId }
      })
    ]);

    // Transformer les données pour le frontend
    const favoritesWithDetails = favoris.map(favori => ({
      id: favori.id,
      materielId: favori.materielId,
      addedAt: favori.createdAt,
      materiel: {
        ...favori.materiel,
        popularity: favori.materiel._count.locations
      }
    }));

    return NextResponse.json({
      success: true,
      data: favoritesWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      message: `${total} matériel(s) dans vos favoris`
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
};

/**
 * Router principal
 */
const mainHandler = async (req: NextRequest): Promise<NextResponse> => {
  switch (req.method) {
    case 'GET':
      return getUserFavoritesHandler(req);
    default:
      return NextResponse.json(
        { success: false, error: `Méthode ${req.method} non autorisée` },
        { status: 405 }
      );
  }
};

// Appliquer les middlewares avec authentification utilisateur
const handler = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['GET'], handler),
  withAuth
)(mainHandler);

export { handler as GET };
