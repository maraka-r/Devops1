import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, withMethodValidation, withAuth, compose } from '@/lib/middleware';

// Handler pour récupérer les favoris de l'utilisateur connecté
const getFavorisHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // L'ID utilisateur est injecté par le middleware withAuth
    const userId = (req as NextRequest & { user: { userId: string } }).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const favoris = await prisma.favori.findMany({
      where: {
        userId,
      },
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            description: true,
            images: true,
            type: true,
            pricePerDay: true,
            status: true,
            specifications: true,
            manualUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(favoris);
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des favoris' },
      { status: 500 }
    );
  }
};

// Handler pour ajouter un matériel aux favoris
const postFavorisHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // L'ID utilisateur est injecté par le middleware withAuth
    const userId = (req as NextRequest & { user: { userId: string } }).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const { materielId } = await req.json();

    if (!materielId) {
      return NextResponse.json(
        { error: 'L\'ID du matériel est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le matériel existe
    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId },
    });

    if (!materiel) {
      return NextResponse.json(
        { error: 'Matériel introuvable' },
        { status: 404 }
      );
    }

    // Vérifier si le favori existe déjà
    const existingFavori = await prisma.favori.findUnique({
      where: {
        userId_materielId: {
          userId,
          materielId,
        },
      },
    });

    if (existingFavori) {
      return NextResponse.json(
        { error: 'Ce matériel est déjà dans vos favoris' },
        { status: 409 }
      );
    }

    // Créer le favori
    const favori = await prisma.favori.create({
      data: {
        userId,
        materielId,
      },
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            description: true,
            images: true,
            type: true,
            pricePerDay: true,
            status: true,
            specifications: true,
            manualUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return NextResponse.json(favori, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du favori:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout du favori' },
      { status: 500 }
    );
  }
};

// Exports avec middleware
const getFavorisWithAuth = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['GET'], handler),
  withAuth
)(getFavorisHandler);

const postFavorisWithAuth = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['POST'], handler),
  withAuth
)(postFavorisHandler);

export { getFavorisWithAuth as GET, postFavorisWithAuth as POST };
