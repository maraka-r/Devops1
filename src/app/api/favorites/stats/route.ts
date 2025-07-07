import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FavoriteStats } from '@/types';

// GET /api/favorites/stats - Statistiques des favoris
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // Si userId est fourni, retourner les stats pour cet utilisateur
    // Sinon, retourner les stats globales (pour les admins)
    
    if (userId) {
      // Stats personnelles de l'utilisateur
      const userFavorites = await prisma.favori.findMany({
        where: { userId: userId },
        include: {
          materiel: {
            select: {
              id: true,
              name: true,
              type: true,
              pricePerDay: true,
              status: true,
              images: true,
              specifications: true,
              manualUrl: true,
              createdAt: true,
              updatedAt: true,
              description: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Compter par catégorie
      const favoritesByCategory: Record<string, number> = {};
      userFavorites.forEach(fav => {
        const category = fav.materiel.type;
        favoritesByCategory[category] = (favoritesByCategory[category] || 0) + 1;
      });

      // Favoris récents (derniers 5)
      const recentlyAdded = userFavorites.slice(0, 5).map(fav => ({
        id: fav.id,
        userId: fav.userId,
        materielId: fav.materielId,
        materiel: {
          ...fav.materiel,
          pricePerDay: Number(fav.materiel.pricePerDay),
          specifications: fav.materiel.specifications as Record<string, unknown> | null
        },
        createdAt: fav.createdAt
      }));

      const response: FavoriteStats = {
        totalFavorites: userFavorites.length,
        favoritesByCategory,
        mostFavorited: [], // Vide pour les stats utilisateur
        recentlyAdded
      };

      return NextResponse.json({
        success: true,
        data: response,
        message: `Statistiques des favoris pour l'utilisateur`
      });

    } else {
      // Stats globales (pour les admins)
      const totalFavorites = await prisma.favori.count();
      
      // Favoris par catégorie (global)
      const favoritesWithMateriel = await prisma.favori.findMany({
        include: {
          materiel: {
            select: {
              type: true
            }
          }
        }
      });

      const favoritesByCategory: Record<string, number> = {};
      favoritesWithMateriel.forEach(fav => {
        const category = fav.materiel.type;
        favoritesByCategory[category] = (favoritesByCategory[category] || 0) + 1;
      });

      // Matériels les plus mis en favoris
      const materielFavoriteCount = await prisma.favori.groupBy({
        by: ['materielId'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });

      const mostFavorited = await Promise.all(
        materielFavoriteCount.map(async (item) => {
          const materiel = await prisma.materiel.findUnique({
            where: { id: item.materielId },
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
              pricePerDay: true,
              status: true,
              images: true,
              specifications: true,
              manualUrl: true,
              createdAt: true,
              updatedAt: true
            }
          });
          
          return {
            materiel: materiel ? {
              ...materiel,
              pricePerDay: Number(materiel.pricePerDay),
              specifications: materiel.specifications as Record<string, unknown> | null
            } : null,
            count: item._count.id
          };
        })
      );

      // Favoris récents (global)
      const recentFavorites = await prisma.favori.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
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
              specifications: true,
              manualUrl: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      const recentlyAdded = recentFavorites.map(fav => ({
        id: fav.id,
        userId: fav.userId,
        materielId: fav.materielId,
        materiel: {
          ...fav.materiel,
          pricePerDay: Number(fav.materiel.pricePerDay),
          specifications: fav.materiel.specifications as Record<string, unknown> | null
        },
        createdAt: fav.createdAt
      }));

      const response: FavoriteStats = {
        totalFavorites,
        favoritesByCategory,
        mostFavorited: mostFavorited.filter(item => item.materiel !== null).map(item => ({
          materiel: item.materiel!,
          count: item.count
        })),
        recentlyAdded
      };

      return NextResponse.json({
        success: true,
        data: response,
        message: `Statistiques globales des favoris`
      });
    }

  } catch (error) {
    console.error('Error fetching favorite stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques' 
      },
      { status: 500 }
    );
  }
}
