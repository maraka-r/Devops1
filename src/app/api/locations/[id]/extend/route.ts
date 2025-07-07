// API Route pour prolonger une location
// POST /api/locations/[id]/extend - Prolonger la durée d'une location

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

// Schéma de validation pour la prolongation
const extendLocationSchema = z.object({
  newEndDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Date invalide')
    .transform((date) => new Date(date))
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Implémenter l'authentification
    const isAuthenticated = true; // Placeholder
    const userId = 'user-id'; // Placeholder
    
    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 });
    }

    const body = await request.json();
    const validation = extendLocationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Données invalides',
        details: validation.error.format()
      }, { status: 400 });
    }

    const { newEndDate } = validation.data;
    const params = await context.params;

    // Récupérer la location
    const location = await prisma.location.findUnique({
      where: { id: params.id },
      include: {
        materiel: true
      }
    });

    if (!location) {
      return NextResponse.json({
        success: false,
        error: 'Location non trouvée'
      }, { status: 404 });
    }

    // Vérifier les permissions
    const isAdmin = true; // Placeholder
    if (location.userId !== userId && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé'
      }, { status: 403 });
    }

    // Vérifier que la location peut être prolongée
    if (!['PENDING', 'CONFIRMED', 'ACTIVE'].includes(location.status)) {
      return NextResponse.json({
        success: false,
        error: 'Cette location ne peut pas être prolongée'
      }, { status: 400 });
    }

    // Vérifier que la nouvelle date est après la date de fin actuelle
    if (newEndDate <= location.endDate) {
      return NextResponse.json({
        success: false,
        error: 'La nouvelle date de fin doit être après la date de fin actuelle'
      }, { status: 400 });
    }

    // Vérifier les conflits avec d'autres locations
    const conflictingLocation = await prisma.location.findFirst({
      where: {
        materielId: location.materielId,
        id: { not: params.id },
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        startDate: { lte: newEndDate },
        endDate: { gte: location.endDate }
      }
    });

    if (conflictingLocation) {
      return NextResponse.json({
        success: false,
        error: 'Le matériel est déjà réservé sur cette période'
      }, { status: 409 });
    }

    // Calculer le nouveau prix total
    const totalDays = Math.ceil(
      (newEndDate.getTime() - location.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const newTotalPrice = totalDays * Number(location.materiel.pricePerDay);

    // Mettre à jour la location
    const updatedLocation = await prisma.location.update({
      where: { id: params.id },
      data: {
        endDate: newEndDate,
        totalPrice: newTotalPrice
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        materiel: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerDay: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedLocation,
      message: 'Location prolongée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la prolongation de la location:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la prolongation de la location'
    }, { status: 500 });
  }
}
