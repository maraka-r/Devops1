import { NextRequest, NextResponse } from 'next/server';
import { updateMaterielSchema } from '@/lib/validation';
import { handlePrismaError } from '@/lib/utils';
import prisma from '@/lib/db';

// GET /api/materiels/[id] - Récupérer un matériel par ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const materiel = await prisma.materiel.findUnique({
      where: { id: params.id },
      include: {
        locations: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            totalPrice: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!materiel) {
      return NextResponse.json({
        success: false,
        error: 'Matériel non trouvé'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: materiel,
      message: 'Matériel récupéré avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du matériel:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 400 });
  }
}

// PUT /api/materiels/[id] - Mettre à jour un matériel (admin seulement)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Implémenter la vérification d'authentification admin
    // Pour l'instant, on utilise un placeholder
    const isAuthenticated = true;
    const isAdmin = true;
    
    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé - Admin requis'
      }, { status: 403 });
    }

    const body = await request.json();
    const params = await context.params;
    
    // Validation des données
    const validation = updateMaterielSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides', 
          details: validation.error.format() 
        },
        { status: 400 }
      );
    }

    // Vérifier que le matériel existe
    const existingMateriel = await prisma.materiel.findUnique({
      where: { id: params.id }
    });

    if (!existingMateriel) {
      return NextResponse.json(
        { success: false, error: 'Matériel non trouvé' },
        { status: 404 }
      );
    }

    const { name, type, description, pricePerDay, status, specifications, images, manualUrl } = validation.data;

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (pricePerDay !== undefined) updateData.pricePerDay = pricePerDay;
    if (status !== undefined) updateData.status = status;
    if (specifications !== undefined) updateData.specifications = specifications;
    if (images !== undefined) updateData.images = images;
    if (manualUrl !== undefined) updateData.manualUrl = manualUrl;

    const materiel = await prisma.materiel.update({
      where: { id: params.id },
      data: updateData,
      include: {
        locations: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            totalPrice: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: materiel,
      message: 'Matériel modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du matériel:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 400 });
  }
}

// DELETE /api/materiels/[id] - Supprimer un matériel (admin seulement)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Implémenter la vérification d'authentification admin
    // Pour l'instant, on utilise un placeholder
    const isAuthenticated = true;
    const isAdmin = true;
    
    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé - Admin requis'
      }, { status: 403 });
    }

    const params = await context.params;
    
    // Vérifier que le matériel existe
    const materiel = await prisma.materiel.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            locations: true
          }
        }
      }
    });

    if (!materiel) {
      return NextResponse.json(
        { success: false, error: 'Matériel non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des locations actives
    const activeLocations = await prisma.location.count({
      where: {
        materielId: params.id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE']
        }
      }
    });

    if (activeLocations > 0) {
      return NextResponse.json({
        success: false,
        error: `Impossible de supprimer le matériel: ${activeLocations} location(s) active(s)`
      }, { status: 409 });
    }

    await prisma.materiel.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Matériel supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du matériel:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 400 });
  }
}
