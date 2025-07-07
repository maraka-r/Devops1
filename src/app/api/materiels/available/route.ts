// API Route pour récupérer les matériels disponibles
// GET /api/materiels/available - Matériels disponibles pour location (clients)

import { NextRequest, NextResponse } from 'next/server';
import { paginationSchema } from '@/lib/validation';
import { handlePrismaError } from '@/lib/utils';
import prisma from '@/lib/db';

/**
 * GET /api/materiels/available
 * Récupère les matériels disponibles pour la location
 * Accessible aux clients et visiteurs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Paramètres de filtrage
    const type = searchParams.get('type');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validation des paramètres
    const paginationData = {
      page,
      limit,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const paginationValidation = paginationSchema.safeParse(paginationData);
    if (!paginationValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Paramètres de pagination invalides',
          details: paginationValidation.error.format()
        },
        { status: 400 }
      );
    }

    // Construction des filtres
    const where: Record<string, unknown> = {
      available: true // Seulement les matériels disponibles
    };

    if (type) where.type = type;
    
    if (priceMin || priceMax) {
      where.pricePerDay = {};
      if (priceMin) (where.pricePerDay as Record<string, unknown>).gte = parseFloat(priceMin);
      if (priceMax) (where.pricePerDay as Record<string, unknown>).lte = parseFloat(priceMax);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtrage par disponibilité pour une période donnée
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return NextResponse.json(
          { success: false, error: 'La date de fin doit être après la date de début' },
          { status: 400 }
        );
      }

      // Exclure les matériels qui ont des locations confirmées/actives dans cette période
      const conflictingMaterielIds = await prisma.location.findMany({
        where: {
          status: {
            in: ['CONFIRMED', 'ACTIVE']
          },
          OR: [
            {
              AND: [
                { startDate: { lte: end } },
                { endDate: { gte: start } }
              ]
            }
          ]
        },
        select: {
          materielId: true
        }
      });

      const excludeIds = conflictingMaterielIds.map(l => l.materielId);
      if (excludeIds.length > 0) {
        where.id = { notIn: excludeIds };
      }
    }

    // Tri
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    // Exécution des requêtes
    const [materiels, total] = await Promise.all([
      prisma.materiel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              locations: true
            }
          }
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
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        type,
        priceMin: priceMin ? parseFloat(priceMin) : null,
        priceMax: priceMax ? parseFloat(priceMax) : null,
        search,
        availability: startDate && endDate ? { startDate, endDate } : null
      },
      message: `${total} matériel(s) disponible(s) trouvé(s)`
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des matériels disponibles:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}
