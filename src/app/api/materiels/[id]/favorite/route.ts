// API Route pour la gestion des favoris d'un matériel
// POST /api/materiels/[id]/favorite - Ajouter un matériel aux favoris
// DELETE /api/materiels/[id]/favorite - Retirer un matériel des favoris

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withMethodValidation, withAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import { handlePrismaError } from '@/lib/utils';
import prisma from '@/lib/db';

/**
 * Handler pour ajouter un matériel aux favoris
 */
const addToFavoritesHandler = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    // L'ID utilisateur est injecté par le middleware withAuth
    const userId = (request as NextRequest & { user: { userId: string } }).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const materielId = params.id;

    // Vérifier que le matériel existe et est disponible
    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId },
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    if (!materiel) {
      return NextResponse.json(
        { success: false, error: 'Matériel non trouvé' },
        { status: 404 }
      );
    }

    if (materiel.status !== 'AVAILABLE') {
      return NextResponse.json(
        { success: false, error: 'Ce matériel n\'est pas disponible' },
        { status: 400 }
      );
    }

    // Vérifier si le favori existe déjà
    const existingFavori = await prisma.favori.findUnique({
      where: {
        userId_materielId: {
          userId,
          materielId
        }
      }
    });

    if (existingFavori) {
      return NextResponse.json(
        { success: false, error: 'Ce matériel est déjà dans vos favoris' },
        { status: 409 }
      );
    }

    // Créer le favori
    const favori = await prisma.favori.create({
      data: {
        userId,
        materielId
      },
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerDay: true,
            images: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: favori,
      message: `${materiel.name} ajouté à vos favoris`
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
};

/**
 * Handler pour retirer un matériel des favoris
 */
const removeFromFavoritesHandler = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    // L'ID utilisateur est injecté par le middleware withAuth
    const userId = (request as NextRequest & { user: { userId: string } }).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const materielId = params.id;

    // Vérifier que le favori existe
    const existingFavori = await prisma.favori.findUnique({
      where: {
        userId_materielId: {
          userId,
          materielId
        }
      },
      include: {
        materiel: {
          select: {
            name: true
          }
        }
      }
    });

    if (!existingFavori) {
      return NextResponse.json(
        { success: false, error: 'Ce matériel n\'est pas dans vos favoris' },
        { status: 404 }
      );
    }

    // Supprimer le favori
    await prisma.favori.delete({
      where: {
        userId_materielId: {
          userId,
          materielId
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `${existingFavori.materiel.name} retiré de vos favoris`
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du favori:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
};

/**
 * POST /api/materiels/[id]/favorite
 * Ajouter un matériel aux favoris
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Appliquer les middlewares pour POST
  const handler = compose(
    withErrorHandler,
    (handler) => withMethodValidation(['POST'], handler),
    withAuth
  )((req: NextRequest) => addToFavoritesHandler(req, context));

  return handler(request);
}

/**
 * DELETE /api/materiels/[id]/favorite
 * Retirer un matériel des favoris
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Appliquer les middlewares pour DELETE
  const handler = compose(
    withErrorHandler,
    (handler) => withMethodValidation(['DELETE'], handler),
    withAuth
  )((req: NextRequest) => removeFromFavoritesHandler(req, context));

  return handler(request);
}
