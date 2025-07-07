// GET /api/billing/payments - Lister l'historique des paiements
// Accès : utilisateur connecté (ses paiements) ou admin (tous)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  paginationSchema, 
  paymentFiltersSchema
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
    const filtersResult = paymentFiltersSchema.safeParse({
      userId: searchParams.get('userId'),
      invoiceId: searchParams.get('invoiceId'),
      status: searchParams.get('status'),
      method: searchParams.get('method'),
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
    const where: Prisma.PaymentWhereInput = {};

    // Restriction par utilisateur (les utilisateurs ne voient que leurs paiements)
    if (user.role !== UserRole.ADMIN) {
      where.userId = user.id;
    } else if (filters.userId) {
      where.userId = filters.userId;
    }

    // Filtres par facture
    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }

    // Filtres par statut
    if (filters.status) {
      where.status = filters.status;
    }

    // Filtres par méthode de paiement
    if (filters.method) {
      where.method = filters.method;
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
    const orderBy: Prisma.PaymentOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.PaymentOrderByWithRelationInput] = sortOrder;

    // Requête avec pagination
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
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
          invoice: {
            select: {
              id: true,
              number: true,
              totalAmount: true,
              status: true,
              dueDate: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    // Calcul des statistiques
    const [statusStats, methodStats, totalStats] = await Promise.all([
      // Statistiques par statut
      prisma.payment.groupBy({
        by: ['status'],
        where: user.role !== UserRole.ADMIN ? { userId: user.id } : {},
        _count: { id: true },
        _sum: { amount: true },
      }),
      // Statistiques par méthode
      prisma.payment.groupBy({
        by: ['method'],
        where: user.role !== UserRole.ADMIN ? { userId: user.id } : {},
        _count: { id: true },
        _sum: { amount: true },
      }),
      // Totaux généraux
      prisma.payment.aggregate({
        where: user.role !== UserRole.ADMIN ? { userId: user.id } : {},
        _count: { id: true },
        _sum: { amount: true },
        _avg: { amount: true },
      }),
    ]);

    const summary = {
      totalPayments: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalAmount: Number(totalStats._sum.amount || 0),
      averageAmount: Number(totalStats._avg.amount || 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byStatus: statusStats.reduce((acc: Record<string, { count: number; amount: number }>, stat: any) => {
        acc[stat.status] = {
          count: stat._count.id,
          amount: Number(stat._sum.amount || 0),
        };
        return acc;
      }, {} as Record<string, { count: number; amount: number }>),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byMethod: methodStats.reduce((acc: Record<string, { count: number; amount: number }>, stat: any) => {
        acc[stat.method] = {
          count: stat._count.id,
          amount: Number(stat._sum.amount || 0),
        };
        return acc;
      }, {} as Record<string, { count: number; amount: number }>),
    };

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
