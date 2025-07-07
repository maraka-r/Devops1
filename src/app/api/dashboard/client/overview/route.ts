import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/client/overview
 * Vue d'ensemble du dashboard client
 * 
 * @description Fournit une vue d'ensemble complète pour le client incluant :
 * - Statistiques personnelles de location
 * - Locations actives et à venir
 * - Matériel favori
 * - Dépenses récentes
 * - Alertes et notifications
 * 
 * @param {string} userId - ID de l'utilisateur (query parameter)
 * @returns {Object} Vue d'ensemble complète du client
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId est requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Dates de référence
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));

    // Statistiques générales du client
    const [
      totalLocations,
      activeLocations,
      completedLocations,
      totalSpent,
      monthlySpent,
      favoriteCount,
      upcomingLocations
    ] = await Promise.all([
      // Total des locations
      prisma.location.count({
        where: { userId }
      }),
      // Locations actives
      prisma.location.count({
        where: { 
          userId,
          status: 'ACTIVE'
        }
      }),
      // Locations terminées
      prisma.location.count({
        where: { 
          userId,
          status: 'COMPLETED'
        }
      }),
      // Total dépensé (toutes les locations)
      prisma.location.aggregate({
        where: { 
          userId,
          status: 'COMPLETED'
        },
        _sum: { totalPrice: true }
      }),
      // Dépenses ce mois
      prisma.location.aggregate({
        where: { 
          userId,
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth }
        },
        _sum: { totalPrice: true }
      }),
      // Nombre de favoris
      prisma.favori.count({
        where: { userId }
      }),
      // Locations à venir (statut PENDING)
      prisma.location.count({
        where: { 
          userId,
          status: 'PENDING',
          startDate: { gt: now }
        }
      })
    ]);

    // Locations actives détaillées
    const currentActiveLocations = await prisma.location.findMany({
      where: { 
        userId,
        status: 'ACTIVE'
      },
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerDay: true,
            images: true
          }
        }
      },
      orderBy: { startDate: 'desc' },
      take: 5
    });

    // Locations à venir détaillées
    const upcomingLocationsDetails = await prisma.location.findMany({
      where: { 
        userId,
        status: 'PENDING',
        startDate: { gt: now }
      },
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerDay: true,
            images: true
          }
        }
      },
      orderBy: { startDate: 'asc' },
      take: 5
    });

    // Top 3 matériels favoris
    const topFavorites = await prisma.favori.findMany({
      where: { userId },
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerDay: true,
            status: true,
            images: true
          }
        }
      },
      take: 3
    });

    // Filtrer seulement les matériels disponibles
    const availableFavorites = topFavorites.filter(fav => fav.materiel.status === 'AVAILABLE');

    // Historique des dépenses (6 derniers mois)
    const monthlySpending = await prisma.location.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 5, 1)
        }
      },
      _sum: { totalPrice: true },
      orderBy: { createdAt: 'asc' }
    });

    // Formater les dépenses mensuelles
    const spendingByMonth = monthlySpending.reduce((acc, record) => {
      const month = new Date(record.createdAt).toLocaleString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      });
      acc[month] = (acc[month] || 0) + Number(record._sum.totalPrice || 0);
      return acc;
    }, {} as Record<string, number>);

    // Alertes et notifications
    const alerts = [];
    
    // Alerte location se terminant bientôt
    const endingSoon = await prisma.location.count({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: {
          lte: new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)) // 2 jours
        }
      }
    });

    if (endingSoon > 0) {
      alerts.push({
        type: 'warning',
        title: 'Locations se terminant bientôt',
        message: `${endingSoon} location(s) se termine(nt) dans les 2 prochains jours`,
        count: endingSoon
      });
    }

    // Alerte factures impayées
    const unpaidInvoices = await prisma.invoice.count({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    if (unpaidInvoices > 0) {
      alerts.push({
        type: 'error',
        title: 'Factures impayées',
        message: `${unpaidInvoices} facture(s) en attente de paiement`,
        count: unpaidInvoices
      });
    }

    // Nouvelles disponibilités dans les favoris
    const newAvailableFavorites = await prisma.favori.findMany({
      where: {
        userId,
        materiel: {
          status: 'AVAILABLE',
          updatedAt: { gte: startOfWeek }
        }
      },
      include: {
        materiel: true
      }
    });

    if (newAvailableFavorites.length) {
      alerts.push({
        type: 'info',
        title: 'Nouveaux matériels disponibles',
        message: `${newAvailableFavorites.length} de vos matériels favoris sont maintenant disponibles`,
        count: newAvailableFavorites.length
      });
    }

    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          role: user.role,
          memberSince: user.createdAt
        },
        statistics: {
          locations: {
            total: totalLocations,
            active: activeLocations,
            completed: completedLocations,
            upcoming: upcomingLocations
          },
          spending: {
            total: totalSpent._sum.totalPrice || 0,
            thisMonth: monthlySpent._sum.totalPrice || 0,
            byMonth: spendingByMonth
          },
          favorites: {
            count: favoriteCount || 0,
            available: availableFavorites.length
          }
        },
        currentActivity: {
          activeLocations: currentActiveLocations.map(location => ({
            id: location.id,
            materiel: location.materiel,
            startDate: location.startDate,
            endDate: location.endDate,
            totalPrice: location.totalPrice,
            status: location.status,
            daysRemaining: Math.ceil((location.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          })),
          upcomingLocations: upcomingLocationsDetails.map(location => ({
            id: location.id,
            materiel: location.materiel,
            startDate: location.startDate,
            endDate: location.endDate,
            totalPrice: location.totalPrice,
            status: location.status,
            daysUntilStart: Math.ceil((location.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          }))
        },
        favoriteMateriels: availableFavorites.map(fav => fav.materiel),
        alerts,
        period: {
          startOfMonth,
          startOfWeek,
          current: now
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur dashboard client overview:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
