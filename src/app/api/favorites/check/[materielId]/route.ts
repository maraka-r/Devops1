import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/favorites/check/[materielId] - Vérifier si un matériel est dans les favoris
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ materielId: string }> }
) {
  try {
    const params = await context.params;
    const { materielId } = params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // Validation des paramètres
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID utilisateur requis' 
        },
        { status: 400 }
      );
    }

    if (!materielId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID matériel requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier si le favori existe
    const favorite = await prisma.favori.findUnique({
      where: {
        userId_materielId: {
          userId: userId,
          materielId: materielId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        isFavorite: !!favorite,
        favoriteId: favorite?.id || null
      },
      message: favorite ? 'Matériel dans les favoris' : 'Matériel pas dans les favoris'
    });

  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la vérification du statut favori' 
      },
      { status: 500 }
    );
  }
}
