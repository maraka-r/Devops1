import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ materielId: string }> }
) {
  try {
    // Authentification
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token manquant' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const params = await context.params;
    const { materielId } = params;

    if (!materielId) {
      return NextResponse.json(
        { error: 'L\'ID du matériel est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le favori existe
    const existingFavori = await prisma.favori.findUnique({
      where: {
        userId_materielId: {
          userId,
          materielId,
        },
      },
    });

    if (!existingFavori) {
      return NextResponse.json(
        { error: 'Ce matériel n\'est pas dans vos favoris' },
        { status: 404 }
      );
    }

    // Supprimer le favori
    await prisma.favori.delete({
      where: {
        userId_materielId: {
          userId,
          materielId,
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Favori supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du favori:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du favori' },
      { status: 500 }
    );
  }
}
