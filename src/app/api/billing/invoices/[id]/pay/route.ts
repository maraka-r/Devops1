// POST /api/billing/invoices/[id]/pay - Payer une facture (mode démo)
// Accès : propriétaire de la facture ou admin

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { idParamSchema, payInvoiceSchema } from '@/lib/validation';
import { UserRole } from '@/types';

export async function POST(
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

    // Validation des données de paiement
    const body = await request.json();
    const paymentResult = payInvoiceSchema.safeParse(body);
    if (!paymentResult.success) {
      return NextResponse.json(
        { error: 'Données de paiement invalides', details: paymentResult.error.issues },
        { status: 400 }
      );
    }

    const { id } = idResult.data;
    const { method, amount, reference, notes } = paymentResult.data;

    // Récupération de la facture
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: {
          where: { status: 'COMPLETED' }
        }
      }
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

    // Vérification du statut de la facture
    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cette facture est déjà payée' },
        { status: 400 }
      );
    }

    if (invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Impossible de payer une facture annulée' },
        { status: 400 }
      );
    }

    // Calcul du montant déjà payé
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remainingAmount = Number(invoice.totalAmount) - totalPaid;

    // Vérification du montant à payer
    const paymentAmount = amount || remainingAmount;
    if (paymentAmount > remainingAmount) {
      return NextResponse.json(
        { error: `Le montant ne peut pas dépasser le solde restant de ${remainingAmount.toFixed(2)}€` },
        { status: 400 }
      );
    }

    if (paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Le montant doit être positif' },
        { status: 400 }
      );
    }

    // Simulation du traitement de paiement (mode démo)
    const simulatePaymentSuccess = Math.random() > 0.1; // 90% de chance de succès en mode démo

    // Création du paiement
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        invoiceId: id,
        amount: paymentAmount,
        method,
        status: simulatePaymentSuccess ? 'COMPLETED' : 'FAILED',
        transactionId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reference: reference || `PAY-${Date.now()}`,
        processedAt: simulatePaymentSuccess ? new Date() : null,
        notes: notes || (simulatePaymentSuccess ? 'Paiement simulé réussi' : 'Paiement simulé échoué'),
      },
    });

    // Mise à jour du statut de la facture si elle est entièrement payée
    let updatedInvoice = invoice;
    if (simulatePaymentSuccess) {
      const newTotalPaid = totalPaid + paymentAmount;
      const newRemainingAmount = Number(invoice.totalAmount) - newTotalPaid;

      if (newRemainingAmount <= 0) {
        updatedInvoice = await prisma.invoice.update({
          where: { id },
          data: {
            status: 'PAID',
            paidDate: new Date(),
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                company: true,
              },
            },
            items: true,
            payments: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      }
    }

    const response = {
      payment,
      invoice: updatedInvoice,
      success: simulatePaymentSuccess,
      message: simulatePaymentSuccess 
        ? `Paiement de ${paymentAmount.toFixed(2)}€ effectué avec succès`
        : 'Le paiement a échoué. Veuillez réessayer.',
      remainingAmount: simulatePaymentSuccess ? Math.max(0, remainingAmount - paymentAmount) : remainingAmount,
    };

    return NextResponse.json(response, { 
      status: simulatePaymentSuccess ? 200 : 400 
    });

  } catch (error) {
    console.error('Erreur lors du paiement de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
