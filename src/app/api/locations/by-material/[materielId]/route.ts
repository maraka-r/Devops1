import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET: Récupérer toutes les locations pour un matériel spécifique
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ materielId: string }> }
) {
  try {
    // Récupération de l'ID du matériel depuis les paramètres de l'URL
    const params = await context.params;
    const materielId = params.materielId;
    
    if (!materielId) {
      return NextResponse.json(
        { error: 'ID du matériel manquant' },
        { status: 400 }
      );
    }

    const locations = await prisma.location.findMany({
      where: {
        materielId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        materiel: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Erreur lors de la récupération des locations par matériel:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des locations' },
      { status: 500 }
    );
  }
}