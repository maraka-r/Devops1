// API Route pour la gestion d'une location spécifique
// GET /api/locations/[id] - Récupérer une location par ID
// PUT /api/locations/[id] - Modifier une location par ID
// DELETE /api/locations/[id] - Supprimer une location par ID

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/locations/[id] - Récupérer une location par ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const location = await prisma.location.findUnique({
      where: { id: params.id },
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
            pricePerDay: true,
            description: true,
            specifications: true,
            images: true
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

    return NextResponse.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la location:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération de la location'
    }, { status: 500 });
  }
}

// PUT /api/locations/[id] - Mettre à jour une location
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Vérifier l'authentification et les permissions
    const isAuthenticated = true; // Placeholder
    const userId = 'user-id'; // Placeholder
    
    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes } = body;
    const params = await context.params;

    // Vérifier que la location existe et appartient à l'utilisateur
    const existingLocation = await prisma.location.findUnique({
      where: { id: params.id },
      include: { materiel: true }
    });

    if (!existingLocation) {
      return NextResponse.json({
        success: false,
        error: 'Location non trouvée'
      }, { status: 404 });
    }

    // Vérifier les permissions (utilisateur propriétaire ou admin)
    const isAdmin = true; // Placeholder
    if (existingLocation.userId !== userId && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé'
      }, { status: 403 });
    }

    const location = await prisma.location.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(notes && { notes })
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
      data: location
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la location:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la mise à jour de la location'
    }, { status: 500 });
  }
}

// DELETE /api/locations/[id] - Annuler une location
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Vérifier l'authentification et les permissions
    const isAuthenticated = true; // Placeholder
    const userId = 'user-id'; // Placeholder
    
    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 });
    }

    const params = await context.params;
    // Vérifier que la location existe
    const existingLocation = await prisma.location.findUnique({
      where: { id: params.id }
    });

    if (!existingLocation) {
      return NextResponse.json({
        success: false,
        error: 'Location non trouvée'
      }, { status: 404 });
    }

    // Vérifier les permissions (utilisateur propriétaire ou admin)
    const isAdmin = true; // Placeholder
    if (existingLocation.userId !== userId && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé'
      }, { status: 403 });
    }

    // Marquer comme annulée au lieu de supprimer
    await prisma.location.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({
      success: true,
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
