import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createLocationSchema } from '@/lib/validation';

// GET /api/locations - Récupérer toutes les locations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.location.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: locations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des locations:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des locations'
    }, { status: 500 });
  }
}

// POST /api/locations - Créer une nouvelle location
export async function POST(request: NextRequest) {
  try {
    // TODO: Vérifier l'authentification
    const isAuthenticated = true; // Placeholder
    const userId = 'user-id'; // Placeholder
    
    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise'
      }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createLocationSchema.parse(body);

    // Vérifier la disponibilité du matériel
    const materiel = await prisma.materiel.findUnique({
      where: { id: validatedData.materielId }
    });

    if (!materiel) {
      return NextResponse.json({
        success: false,
        error: 'Matériel non trouvé'
      }, { status: 404 });
    }

    if (!materiel.available) {
      return NextResponse.json({
        success: false,
        error: 'Ce matériel n\'est pas disponible'
      }, { status: 400 });
    }

    // Vérifier les conflits de dates
    const existingLocation = await prisma.location.findFirst({
      where: {
        materielId: validatedData.materielId,
        status: 'ACTIVE',
        OR: [
          {
            startDate: { lte: validatedData.endDate },
            endDate: { gte: validatedData.startDate }
          }
        ]
      }
    });

    if (existingLocation) {
      return NextResponse.json({
        success: false,
        error: 'Le matériel est déjà réservé sur cette période'
      }, { status: 400 });
    }

    // Calculer le prix total
    const days = Math.ceil(
      (new Date(validatedData.endDate).getTime() - new Date(validatedData.startDate).getTime()) 
      / (1000 * 60 * 60 * 24)
    );
    const totalPrice = days * Number(materiel.pricePerDay);

    const location = await prisma.location.create({
      data: {
        ...validatedData,
        userId,
        totalPrice,
        status: 'ACTIVE'
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
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la location:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création de la location'
    }, { status: 500 });
  }
}
