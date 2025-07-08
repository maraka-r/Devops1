import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withMethodValidation, withAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import prisma from '@/lib/db';
import { createMaterielSchema } from '@/lib/validation';

// GET /api/materiels - Récupérer tous les matériels
const getMaterielsHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
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
      data: {
        data: materiels,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Matériels récupérés avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des matériels:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des matériels'
    }, { status: 500 });
  }
};

// POST /api/materiels - Créer un nouveau matériel  
const createMaterielHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
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
      data: materiel,
      message: 'Matériel créé avec succès'
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du matériel:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création du matériel'
    }, { status: 500 });
  }
};

// Appliquer les middlewares
const getHandler = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['GET'], handler),
  withAuth
)(getMaterielsHandler);

const postHandler = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['POST'], handler),
  withAuth
)(createMaterielHandler);

export { getHandler as GET, postHandler as POST };
