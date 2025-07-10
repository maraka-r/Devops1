import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET: Récupérer toutes les locations pour un matériel spécifique
 * @param req Requête entrante
 * @param context Contexte avec les paramètres de route
 * @returns Liste des locations pour ce matériel
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { materielId: string } }
) {
  try {
    const { materielId } = params;
    
    if (!materielId) {
      return NextResponse.json(
        { error: 'ID du matériel manquant' },
        { status: 400 }
      );
    }

    const locations = await prisma.location.findMany({
      where: {
        materielId: materielId
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