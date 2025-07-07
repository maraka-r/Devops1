import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/client/favorites
 * Matériel favori du client
 * 
 * @description Fournit la liste des matériels favoris d'un client avec :
 * - Statut de disponibilité actuel
 * - Historique des locations de ces matériels
 * - Alertes de disponibilité
 * - Recommandations basées sur les favoris
 * 
 * @param {string} userId - ID de l'utilisateur (query parameter)
 * @param {boolean} availableOnly - Afficher seulement les disponibles (optional, default: false)
 * @returns {Object} Liste des matériels favoris avec détails
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId est requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les favoris avec détails des matériels
    const favorisQuery = await prisma.favori.findMany({
      where: {
        userId,
        ...(availableOnly && { 
          materiel: { status: 'AVAILABLE' }
        })
      },
      include: {
        materiel: {
          include: {
            locations: {
              where: { userId },
              select: {
                id: true,
                status: true,
                startDate: true,
                endDate: true,
                totalPrice: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 5 // Dernières 5 locations de ce matériel par l'utilisateur
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();

    // Enrichir les données avec des informations supplémentaires
    const enrichedFavorites = await Promise.all(
      favorisQuery.map(async (favori) => {
        const materiel = favori.materiel;
        
        // Calculer les statistiques d'utilisation par l'utilisateur
        const userLocations = materiel.locations;
        const totalLocations = userLocations.length;
        const completedLocations = userLocations.filter(l => l.status === 'COMPLETED').length;
        const totalSpent = userLocations
          .filter(l => l.status === 'COMPLETED')
          .reduce((sum, l) => sum + Number(l.totalPrice), 0);

        // Dernière location de ce matériel par l'utilisateur
        const lastLocation = userLocations[0];
        const daysSinceLastRental = lastLocation 
          ? Math.ceil((now.getTime() - lastLocation.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        // Vérifier si le matériel est actuellement loué par quelqu'un d'autre
        const currentActiveLocation = await prisma.location.findFirst({
          where: {
            materielId: materiel.id,
            status: 'ACTIVE',
            endDate: { gte: now }
          },
          include: {
            user: {
              select: { name: true }
            }
          }
        });

        // Prochaine disponibilité si actuellement loué
        let nextAvailableDate = null;
        if (currentActiveLocation) {
          nextAvailableDate = currentActiveLocation.endDate;
        }

        // Calculer le prix moyen payé par cet utilisateur pour ce matériel
        const averagePricePaid = completedLocations > 0 ? totalSpent / completedLocations : 0;

        // Recommandations basées sur ce favori (matériels similaires)
        const similarMaterials = await prisma.materiel.findMany({
          where: {
            type: materiel.type,
            id: { not: materiel.id },
            status: 'AVAILABLE'
          },
          select: {
            id: true,
            name: true,
            pricePerDay: true,
            images: true
          },
          take: 3
        });

        return {
          favoriteId: favori.id,
          addedToFavoritesAt: favori.createdAt,
          materiel: {
            id: materiel.id,
            name: materiel.name,
            type: materiel.type,
            description: materiel.description,
            pricePerDay: Number(materiel.pricePerDay),
            status: materiel.status,
            specifications: materiel.specifications,
            images: materiel.images,
            manualUrl: materiel.manualUrl,
            createdAt: materiel.createdAt,
            updatedAt: materiel.updatedAt
          },
          availability: {
            isAvailable: materiel.status === 'AVAILABLE',
            status: materiel.status,
            nextAvailableDate,
            currentlyRentedBy: currentActiveLocation?.user.name || null,
            expectedReturnDate: currentActiveLocation?.endDate || null
          },
          userHistory: {
            totalLocations,
            completedLocations,
            totalSpent,
            averagePricePaid,
            lastRentalDate: lastLocation?.createdAt || null,
            daysSinceLastRental,
            recentLocations: userLocations.map(location => ({
              id: location.id,
              status: location.status,
              startDate: location.startDate,
              endDate: location.endDate,
              totalPrice: Number(location.totalPrice),
              createdAt: location.createdAt
            }))
          },
          recommendations: {
            similarMaterials: similarMaterials.map(similar => ({
              id: similar.id,
              name: similar.name,
              pricePerDay: Number(similar.pricePerDay),
              images: similar.images,
              priceDifference: Number(similar.pricePerDay) - Number(materiel.pricePerDay)
            }))
          }
        };
      })
    );

    // Statistiques générales des favoris
    const stats = {
      total: enrichedFavorites.length,
      available: enrichedFavorites.filter(f => f.availability.isAvailable).length,
      rented: enrichedFavorites.filter(f => f.materiel.status === 'RENTED').length,
      maintenance: enrichedFavorites.filter(f => f.materiel.status === 'MAINTENANCE').length,
      outOfOrder: enrichedFavorites.filter(f => f.materiel.status === 'OUT_OF_ORDER').length,
      totalSpentOnFavorites: enrichedFavorites.reduce((sum, f) => sum + f.userHistory.totalSpent, 0),
      averageSpentPerFavorite: enrichedFavorites.length > 0 
        ? enrichedFavorites.reduce((sum, f) => sum + f.userHistory.totalSpent, 0) / enrichedFavorites.length 
        : 0
    };

    // Grouper par statut
    const groupedByStatus = {
      available: enrichedFavorites.filter(f => f.availability.isAvailable),
      rented: enrichedFavorites.filter(f => f.materiel.status === 'RENTED'),
      maintenance: enrichedFavorites.filter(f => f.materiel.status === 'MAINTENANCE'),
      outOfOrder: enrichedFavorites.filter(f => f.materiel.status === 'OUT_OF_ORDER'),
      retired: enrichedFavorites.filter(f => f.materiel.status === 'RETIRED')
    };

    // Alertes et notifications
    const alerts = [];

    // Nouveaux matériels disponibles
    const newlyAvailable = enrichedFavorites.filter(f => 
      f.availability.isAvailable && 
      f.materiel.updatedAt > new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)) // Mis à jour dans les 7 derniers jours
    );
    
    if (newlyAvailable.length > 0) {
      alerts.push({
        type: 'success',
        title: 'Nouveaux favoris disponibles',
        message: `${newlyAvailable.length} de vos matériels favoris sont maintenant disponibles`,
        materials: newlyAvailable.map(f => ({
          id: f.materiel.id,
          name: f.materiel.name,
          pricePerDay: f.materiel.pricePerDay
        }))
      });
    }

    // Matériels bientôt disponibles
    const soonAvailable = enrichedFavorites.filter(f => 
      !f.availability.isAvailable && 
      f.availability.expectedReturnDate &&
      f.availability.expectedReturnDate <= new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)) // Dans les 7 prochains jours
    );

    if (soonAvailable.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Favoris bientôt disponibles',
        message: `${soonAvailable.length} de vos matériels favoris seront disponibles cette semaine`,
        materials: soonAvailable.map(f => ({
          id: f.materiel.id,
          name: f.materiel.name,
          expectedReturnDate: f.availability.expectedReturnDate,
          daysUntilAvailable: Math.ceil(
            (f.availability.expectedReturnDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        }))
      });
    }

    // Recommandations générales
    const allSimilarMaterials = enrichedFavorites
      .flatMap(f => f.recommendations.similarMaterials)
      .filter((material, index, self) => 
        self.findIndex(m => m.id === material.id) === index
      )
      .slice(0, 10);

    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name
        },
        stats,
        favorites: enrichedFavorites,
        groupedByStatus,
        alerts,
        recommendations: {
          similarMaterials: allSimilarMaterials,
          message: `Basé sur vos ${enrichedFavorites.length} matériels favoris`
        },
        filters: {
          availableOnly
        }
      },
      message: `${enrichedFavorites.length} matériel(s) favori(s) trouvé(s)`
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur dashboard client favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
