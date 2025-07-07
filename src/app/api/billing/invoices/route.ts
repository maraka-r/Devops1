// GET /api/billing/invoices - Lister les factures avec filtres
// Accès : utilisateur connecté (ses factures) ou admin (toutes)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  paginationSchema, 
  invoiceFiltersSchema
} from '@/lib/validation';
import { UserRole } from '@/types';
import { Prisma } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Remplacer par la vraie authentification JWT
    const user = {
      id: 'user-placeholder',
      email: 'user@example.com',
      role: 'USER' as UserRole
    };

    const { searchParams } = new URL(request.url);
    
    // Validation des paramètres de pagination
    const paginationResult = paginationSchema.safeParse({
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    if (!paginationResult.success) {
      return NextResponse.json(
        { error: 'Paramètres de pagination invalides', details: paginationResult.error.issues },
        { status: 400 }
      );
    }

    // Validation des filtres
    const filtersResult = invoiceFiltersSchema.safeParse({
      userId: searchParams.get('userId'),
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    if (!filtersResult.success) {
      return NextResponse.json(
        { error: 'Filtres invalides', details: filtersResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, sortBy, sortOrder } = paginationResult.data;
    const filters = filtersResult.data;

    // Construction des conditions de requête
    const where: Prisma.InvoiceWhereInput = {};

    // Restriction par utilisateur (les utilisateurs ne voient que leurs factures)
    if (user.role !== UserRole.ADMIN) {
      where.userId = user.id;
    } else if (filters.userId) {
      where.userId = filters.userId;
    }

    // Filtres par statut
    if (filters.status) {
      where.status = filters.status;
    }

    // Filtres par date
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Construction de l'ordre de tri
    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.InvoiceOrderByWithRelationInput] = sortOrder;

    // Requête avec pagination
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              company: true,
            },
          },
          items: {
            include: {
              location: {
                include: {
                  materiel: {
                    select: {
                      name: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
          payments: {
            where: { status: 'COMPLETED' },
            select: {
              amount: true,
              createdAt: true,
              method: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    // Calcul des statistiques
    const stats = await prisma.invoice.groupBy({
      by: ['status'],
      where: user.role !== UserRole.ADMIN ? { userId: user.id } : {},
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const summary = {
      totalInvoices: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byStatus: stats.reduce((acc: Record<string, { count: number; amount: number }>, stat: any) => {
        acc[stat.status] = {
          count: stat._count.id,
          amount: Number(stat._sum.totalAmount || 0),
        };
        return acc;
      }, {} as Record<string, { count: number; amount: number }>),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalAmount: stats.reduce((sum: number, stat: any) => sum + Number(stat._sum.totalAmount || 0), 0),
    };

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
