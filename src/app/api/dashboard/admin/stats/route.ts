import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

/**
 * GET /api/dashboard/admin/stats
 * Retourne les statistiques générales pour le dashboard admin
 * - Nombre total d'utilisateurs, matériels, locations
 * - Revenus totaux et du mois en cours
 * - Factures (payées/impayées)
 * - Taux d'utilisation des matériels
 */
export async function GET() {
  try {
    // TODO: Vérifier l'authentification et les permissions admin
    // const authUser = await getCurrentUser();
    // if (!authUser || authUser.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Accès refusé. Permissions administrateur requises.' },
    //     { status: 403 }
    //   );
    // }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Statistiques utilisateurs
    const [totalUsers, activeUsers, inactiveUsers, adminUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'INACTIVE' } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    // Statistiques matériels
    const [totalMaterials, availableMaterials, rentedMaterialsCount, maintenanceMaterials] = await Promise.all([
      prisma.materiel.count(),
      prisma.materiel.count({ where: { status: 'AVAILABLE' } }),
      prisma.materiel.count({ where: { status: 'RENTED' } }),
      prisma.materiel.count({ where: { status: 'MAINTENANCE' } })
    ]);

    // Statistiques locations
    const [totalLocations, activeLocations, completedLocations] = await Promise.all([
      prisma.location.count(),
      prisma.location.count({ where: { status: 'ACTIVE' } }),
      prisma.location.count({ where: { status: 'COMPLETED' } })
    ]);

    // Statistiques financières
    const [totalRevenue, monthlyRevenue] = await Promise.all([
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: { totalAmount: true }
      })
    ]);

    // Statistiques factures
    const [totalInvoices, paidInvoices, unpaidInvoices, overdueInvoices] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: now }
        }
      })
    ]);

    // Taux d'utilisation basé sur les statuts (ratio matériels en location vs total)
    const utilizationRate = totalMaterials > 0 
      ? Math.round((rentedMaterialsCount / totalMaterials) * 100)
      : 0;

    // Nombre de nouvelles locations cette semaine
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyNewLocations = await prisma.location.count({
      where: {
        createdAt: { gte: startOfWeek }
      }
    });

    // Nombre de nouveaux utilisateurs cette semaine
    const weeklyNewUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startOfWeek }
      }
    });

    // Convertir les montants Decimal en nombres
    const totalRevenueAmount = totalRevenue._sum.totalAmount 
      ? Number(totalRevenue._sum.totalAmount) 
      : 0;
    const monthlyRevenueAmount = monthlyRevenue._sum.totalAmount 
      ? Number(monthlyRevenue._sum.totalAmount) 
      : 0;

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        admin: adminUsers,
        regular: totalUsers - adminUsers,
        newThisWeek: weeklyNewUsers
      },
      materials: {
        total: totalMaterials,
        available: availableMaterials,
        rented: rentedMaterialsCount,
        maintenance: maintenanceMaterials,
        utilizationRate: utilizationRate
      },
      locations: {
        total: totalLocations,
        active: activeLocations,
        completed: completedLocations,
        newThisWeek: weeklyNewLocations
      },
      financial: {
        totalRevenue: totalRevenueAmount,
        monthlyRevenue: monthlyRevenueAmount,
        averageOrderValue: totalLocations > 0 
          ? Math.round((totalRevenueAmount / totalLocations) * 100) / 100
          : 0
      },
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        unpaid: unpaidInvoices,
        overdue: overdueInvoices,
        paymentRate: totalInvoices > 0 
          ? Math.round((paidInvoices / totalInvoices) * 100)
          : 0
      },
      period: {
        startOfMonth: formatDate(startOfMonth),
        endOfMonth: formatDate(endOfMonth),
        startOfWeek: formatDate(startOfWeek),
        current: formatDate(now)
      }
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
