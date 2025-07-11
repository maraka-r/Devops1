// API Route pour récupérer les locations d'un client spécifique
// GET /api/locations/client/[userId] - Récupérer toutes les locations d'un utilisateur

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Token d\'authentification manquant'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = verifyToken(token);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Token d\'authentification invalide'
      }, { status: 401 });
    }

    const params = await context.params;
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination et filtres
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Vérifier les permissions
    if (params.userId !== decoded.id && decoded.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé'
      }, { status: 403 });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Utilisateur non trouvé'
      }, { status: 404 });
    }

    // Construire les filtres
    const where: Record<string, unknown> = {
      userId: params.userId
    };

    if (status) {
      where.status = status;
    }

    // Récupérer les locations avec pagination
    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          materiel: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
              pricePerDay: true,
              images: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder as 'asc' | 'desc'
        }
      }),
      prisma.location.count({ where })
    ]);

    // Calculer les statistiques
    const stats = await prisma.location.aggregate({
      where: { userId: params.userId },
      _count: {
        id: true
      },
      _sum: {
        totalPrice: true
      }
    });

    const statusStats = await prisma.location.groupBy({
      by: ['status'],
      where: { userId: params.userId },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        user,
        locations,
        stats: {
          totalLocations: stats._count.id,
          totalSpent: stats._sum.totalPrice || 0,
          byStatus: statusStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
          }, {} as Record<string, number>)
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des locations du client:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des locations'
    }, { status: 500 });
  }
}
