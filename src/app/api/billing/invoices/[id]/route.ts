// GET /api/billing/invoices/[id] - Récupérer une facture par ID
// Accès : propriétaire de la facture ou admin

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { idParamSchema } from '@/lib/validation';
import { UserRole } from '@/types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // TODO: Remplacer par la vraie authentification JWT
    const user = {
      id: 'user-placeholder',
      email: 'user@example.com',
      role: 'USER' as UserRole
    };

    // Validation du paramètre ID
    const idResult = idParamSchema.safeParse({ id: params.id });
    if (!idResult.success) {
      return NextResponse.json(
        { error: 'ID de facture invalide' },
        { status: 400 }
      );
    }

    const { id } = idResult.data;

    // Récupération de la facture avec tous les détails
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            company: true,
            phone: true,
            address: true,
          },
        },
        items: {
          include: {
            location: {
              include: {
                materiel: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            transactionId: true,
            reference: true,
            processedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Vérification des permissions
    if (user.role !== UserRole.ADMIN && invoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Calcul des totaux de paiements
    const totalPaid = invoice.payments
      .filter(payment => payment.status === 'COMPLETED')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const remainingAmount = Number(invoice.totalAmount) - totalPaid;

    // Enrichissement des données de la facture
    const enrichedInvoice = {
      ...invoice,
      totalPaid,
      remainingAmount,
      isPaid: remainingAmount <= 0,
      isOverdue: invoice.status === 'PENDING' && new Date() > invoice.dueDate,
    };

    return NextResponse.json({ invoice: enrichedInvoice });

  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
