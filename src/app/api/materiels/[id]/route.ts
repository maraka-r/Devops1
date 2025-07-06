import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { updateMaterielSchema } from '@/lib/validation';

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
          include: {
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
      data: materiel
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du matériel:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération du matériel'
    }, { status: 500 });
  }
}

// PUT /api/materiels/[id] - Mettre à jour un matériel
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Vérifier l'authentification et les permissions admin
    const isAuthenticated = true; // Placeholder
    const isAdmin = true; // Placeholder
    
    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé'
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateMaterielSchema.parse(body);
    const params = await context.params;

    const updateData: Record<string, unknown> = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.pricePerDay) updateData.pricePerDay = validatedData.pricePerDay;
    if (validatedData.available !== undefined) updateData.available = validatedData.available;
    if (validatedData.specifications) updateData.specifications = JSON.parse(JSON.stringify(validatedData.specifications));
    if (validatedData.images) updateData.images = validatedData.images;

    const materiel = await prisma.materiel.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: materiel
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du matériel:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la mise à jour du matériel'
    }, { status: 500 });
  }
}

// DELETE /api/materiels/[id] - Supprimer un matériel
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Vérifier l'authentification et les permissions admin
    const isAuthenticated = true; // Placeholder
    const isAdmin = true; // Placeholder
    
    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé'
      }, { status: 403 });
    }

    const params = await context.params;
    // Vérifier s'il y a des locations actives
    const activeLocations = await prisma.location.findMany({
      where: {
        materielId: params.id,
        status: 'ACTIVE'
      }
    });

    if (activeLocations.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de supprimer un matériel avec des locations actives'
      }, { status: 400 });
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
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la suppression du matériel'
    }, { status: 500 });
  }
}
