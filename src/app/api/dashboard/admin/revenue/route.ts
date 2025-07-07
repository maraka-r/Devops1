import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

/**
 * GET /api/dashboard/admin/revenue
 * Retourne les données de revenus par période
 * Query params:
 * - period: 'daily', 'weekly', 'monthly' (default: 'monthly')
 * - startDate: date de début (ISO string)
 * - endDate: date de fin (ISO string)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Vérifier l'authentification et les permissions admin
    // const authUser = await getCurrentUser();
    // if (!authUser || authUser.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Accès refusé. Permissions administrateur requises.' },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const now = new Date();
    let start: Date;
    let end: Date;

    // Déterminer les dates par défaut selon la période
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'daily':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84); // 12 semaines
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'monthly':
        default:
          start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
      }
    }

    // Récupérer les factures payées dans la période
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PAID',
        paidDate: {
          gte: start,
          lte: end
        }
      },
      select: {
        totalAmount: true,
        taxAmount: true,
        paidDate: true,
        createdAt: true
      },
      orderBy: {
        paidDate: 'asc'
      }
    });

    // Grouper les revenus par période
    const revenueData: { [key: string]: number } = {};
    const taxData: { [key: string]: number } = {};

    paidInvoices.forEach(invoice => {
      const date = invoice.paidDate || invoice.createdAt;
      let periodKey: string;

      switch (period) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Début de semaine (dimanche)
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
        default:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      const amount = Number(invoice.totalAmount);
      const tax = Number(invoice.taxAmount);

      revenueData[periodKey] = (revenueData[periodKey] || 0) + amount;
      taxData[periodKey] = (taxData[periodKey] || 0) + tax;
    });

    // Convertir en tableau pour le graphique
    const chartData = Object.keys(revenueData).map(key => ({
      period: key,
      revenue: revenueData[key],
      tax: taxData[key],
      net: revenueData[key] - taxData[key]
    }));

    // Calculer les totaux et moyennes
    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
    const totalTax = chartData.reduce((sum, item) => sum + item.tax, 0);
    const averageRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;

    // Calculer la croissance (comparaison avec la période précédente)
    const currentPeriodRevenue = chartData.slice(-1)[0]?.revenue || 0;
    const previousPeriodRevenue = chartData.slice(-2)[0]?.revenue || 0;
    const growthRate = previousPeriodRevenue > 0 
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period,
        startDate: formatDate(start),
        endDate: formatDate(end),
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          totalNet: Math.round((totalRevenue - totalTax) * 100) / 100,
          averageRevenue: Math.round(averageRevenue * 100) / 100,
          growthRate: Math.round(growthRate * 100) / 100,
          dataPoints: chartData.length
        },
        chartData,
        metadata: {
          invoicesCount: paidInvoices.length,
          periodType: period,
          generatedAt: formatDate(now)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des revenus:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
