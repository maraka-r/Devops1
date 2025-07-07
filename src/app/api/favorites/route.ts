import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FavoriteListResponse } from '@/types';

// GET /api/favorites - Liste des favoris pour l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // Validation du userId (normalement récupéré du token JWT)
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID utilisateur requis' 
        },
        { status: 400 }
      );
    }

    // Récupérer les favoris de l'utilisateur avec les détails du matériel
    const favorites = await prisma.favori.findMany({
      where: {
        userId: userId
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatter les données pour la réponse
    const formattedFavorites = favorites.map(favorite => ({
      id: favorite.id,
      userId: favorite.userId,
      materielId: favorite.materielId,
      materiel: {
        ...favorite.materiel,
        pricePerDay: Number(favorite.materiel.pricePerDay),
        specifications: favorite.materiel.specifications as Record<string, unknown> | null
      },
      createdAt: favorite.createdAt
    }));

    const response: FavoriteListResponse = {
      success: true,
      data: formattedFavorites,
      message: `${formattedFavorites.length} favori(s) trouvé(s)`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des favoris' 
      },
      { status: 500 }
    );
  }
}
