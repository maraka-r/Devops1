import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FavoriteActionResponse } from '@/types';

// POST /api/favorites/[materielId] - Ajouter un matériel aux favoris
export async function POST(
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

    // Vérifier que le matériel existe
    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId },
      select: {
        id: true,
        name: true,
        type: true,
        pricePerDay: true,
        status: true
      }
    });

    if (!materiel) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Matériel non trouvé' 
        },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Utilisateur non trouvé' 
        },
        { status: 404 }
      );
    }

    // Vérifier si le favori existe déjà
    const existingFavorite = await prisma.favori.findUnique({
      where: {
        userId_materielId: {
          userId: userId,
          materielId: materielId
        }
      }
    });

    if (existingFavorite) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ce matériel est déjà dans vos favoris' 
        },
        { status: 409 }
      );
    }

    // Ajouter aux favoris
    const favorite = await prisma.favori.create({
      data: {
        userId: userId,
        materielId: materielId
      }
    });

    const response: FavoriteActionResponse = {
      success: true,
      message: 'Matériel ajouté aux favoris avec succès',
      data: {
        id: favorite.id,
        added: true,
        materiel: {
          id: materiel.id,
          name: materiel.name,
          type: materiel.type,
          pricePerDay: Number(materiel.pricePerDay),
          status: materiel.status
        }
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'ajout aux favoris' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites/[materielId] - Supprimer un matériel des favoris
export async function DELETE(
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

    // Vérifier que le favori existe
    const existingFavorite = await prisma.favori.findUnique({
      where: {
        userId_materielId: {
          userId: userId,
          materielId: materielId
        }
      },
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerDay: true,
            status: true
          }
        }
      }
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ce matériel n\'est pas dans vos favoris' 
        },
        { status: 404 }
      );
    }

    // Supprimer des favoris
    await prisma.favori.delete({
      where: {
        userId_materielId: {
          userId: userId,
          materielId: materielId
        }
      }
    });

    const response: FavoriteActionResponse = {
      success: true,
      message: 'Matériel supprimé des favoris avec succès',
      data: {
        id: existingFavorite.id,
        added: false,
        materiel: {
          id: existingFavorite.materiel.id,
          name: existingFavorite.materiel.name,
          type: existingFavorite.materiel.type,
          pricePerDay: Number(existingFavorite.materiel.pricePerDay),
          status: existingFavorite.materiel.status
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la suppression des favoris' 
      },
      { status: 500 }
    );
  }
}
