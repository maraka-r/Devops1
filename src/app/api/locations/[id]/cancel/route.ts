// API Route pour annuler une location
// POST /api/locations/[id]/cancel - Annuler une location

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

// Schéma de validation pour l'annulation
const cancelLocationSchema = z.object({
  reason: z.string().min(10, 'La raison doit contenir au moins 10 caractères').optional()
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
    const validation = cancelLocationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Données invalides',
        details: validation.error.format()
      }, { status: 400 });
    }

    const { reason } = validation.data;
    const params = await context.params;

    // Récupérer la location
    const location = await prisma.location.findUnique({
      where: { id: params.id },
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
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

    // Vérifier que la location peut être annulée
    if (location.status === 'CANCELLED') {
      return NextResponse.json({
        success: false,
        error: 'Cette location est déjà annulée'
      }, { status: 400 });
    }

    if (location.status === 'COMPLETED') {
      return NextResponse.json({
        success: false,
        error: 'Impossible d\'annuler une location terminée'
      }, { status: 400 });
    }

    // Construire les notes d'annulation
    let cancellationNotes = 'Location annulée';
    if (reason) {
      cancellationNotes += ` - Raison: ${reason}`;
    }
    
    // Ajouter les notes existantes si elles existent
    if (location.notes) {
      cancellationNotes = `${location.notes}\n\n${cancellationNotes}`;
    }

    // Mettre à jour la location
    const updatedLocation = await prisma.location.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        notes: cancellationNotes
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
      message: 'Location annulée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la location:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'annulation de la location'
    }, { status: 500 });
  }
}
