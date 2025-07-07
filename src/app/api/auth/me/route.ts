// API Route pour récupérer les informations de l'utilisateur connecté
// GET /api/auth/me - Profil utilisateur connecté

import { NextResponse } from 'next/server';
import { withErrorHandler, withMethodValidation, withAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import prisma from '@/lib/db';
import type { AuthenticatedRequest } from '@/lib/middleware';

/**
 * Handler principal pour récupérer le profil utilisateur
 */
const getMeHandler = async (req: AuthenticatedRequest): Promise<NextResponse> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }
    
    // Récupérer les informations complètes de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        company: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        // Inclure quelques statistiques utiles
        locations: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Les 5 dernières locations
        },
        _count: {
          select: {
            locations: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }
    
    // Calculer quelques statistiques simples
    const activeLocations = user.locations.filter(l => l.status === 'ACTIVE').length;
    const totalSpent = user.locations.reduce((sum, l) => sum + Number(l.totalPrice), 0);
    
    const userWithStats = {
      ...user,
      stats: {
        totalLocations: user._count.locations,
        activeLocations,
        totalSpent,
        recentLocations: user.locations
      }
    };
    
    // Retirer le compteur des locations car on a maintenant les stats
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _count, locations, ...userProfile } = userWithStats;
    
    return NextResponse.json({
      success: true,
      data: userProfile,
      message: 'Profil utilisateur récupéré avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
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
  withAuth // Nécessite une authentification
)(getMeHandler);

export { handler as GET };
