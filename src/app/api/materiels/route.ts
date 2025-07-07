import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createMaterielSchema } from '@/lib/validation';

// GET /api/materiels - Récupérer tous les matériels
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [materiels, total] = await Promise.all([
      prisma.materiel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          locations: {
            where: {
              status: 'ACTIVE'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.materiel.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: materiels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des matériels:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des matériels'
    }, { status: 500 });
  }
}

// POST /api/materiels - Créer un nouveau matériel
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions admin
    // TODO: Implémenter la vérification d'authentification
    const isAuthenticated = true; // Placeholder
    const isAdmin = true; // Placeholder
    
    if (!isAuthenticated || !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé'
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createMaterielSchema.parse(body);

    const materiel = await prisma.materiel.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        description: validatedData.description,
        pricePerDay: validatedData.pricePerDay,
        status: validatedData.status,
        specifications: validatedData.specifications ? JSON.parse(JSON.stringify(validatedData.specifications)) : {},
        images: validatedData.images || []
      }
    });

    return NextResponse.json({
      success: true,
      data: materiel
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du matériel:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création du matériel'
    }, { status: 500 });
  }
}
