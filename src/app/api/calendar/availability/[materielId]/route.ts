import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { MaterialAvailability, MaterialAvailabilityResponse, CalendarEvent } from '@/types';

const prisma = new PrismaClient();

/**
 * GET /api/calendar/availability/[materielId]
 * Récupère la disponibilité d'un matériel spécifique
 * 
 * Paramètres d'URL :
 * - materielId : ID du matériel
 * 
 * Paramètres de requête :
 * - startDate (optionnel) : Date de début (ISO string, défaut: début du mois courant)
 * - endDate (optionnel) : Date de fin (ISO string, défaut: fin du mois courant)
 * - period (optionnel) : Période prédéfinie (week, month, quarter, défaut: month)
 * - includeMaintenance (optionnel) : Inclure les périodes de maintenance
 * - showTimeSlots (optionnel) : Afficher les créneaux horaires (matin/après-midi)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ materielId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { materielId } = await context.params;
    
    // Validation de l'ID du matériel
    if (!materielId) {
      return NextResponse.json(
        { success: false, error: 'ID du matériel requis' },
        { status: 400 }
      );
    }

    // Vérifier que le matériel existe
    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true
      }
    });

    if (!materiel) {
      return NextResponse.json(
        { success: false, error: 'Matériel non trouvé' },
        { status: 404 }
      );
    }

    // Paramètres de requête
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const period = searchParams.get('period') || 'month';
    const includeMaintenance = searchParams.get('includeMaintenance') === 'true';
    const showTimeSlots = searchParams.get('showTimeSlots') === 'true';

    // Calculer les dates selon la période
    const { startDate, endDate } = calculatePeriodDates(period, startDateParam, endDateParam);

    // Validation des dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Format de date invalide' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, error: 'La date de début doit être antérieure à la date de fin' },
        { status: 400 }
      );
    }

    // Récupération des locations existantes pour ce matériel
    const locations = await prisma.location.findMany({
      where: {
        materielId,
        AND: [
          {
            OR: [
              { startDate: { gte: startDate, lte: endDate } },
              { endDate: { gte: startDate, lte: endDate } },
              { 
                AND: [
                  { startDate: { lte: startDate } },
                  { endDate: { gte: endDate } }
                ]
              }
            ]
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Générer la disponibilité jour par jour
    const availability: MaterialAvailability[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Vérifier les locations pour ce jour
      const dayLocations = locations.filter(location => 
        location.startDate <= dayEnd && location.endDate >= dayStart
      );

      // Convertir les locations en événements
      const dayEvents: CalendarEvent[] = dayLocations.map(location => ({
        id: location.id,
        title: `Location - ${materiel.name}`,
        description: `Location par ${location.user.name}`,
        startDate: location.startDate,
        endDate: location.endDate,
        type: 'location',
        status: location.status.toLowerCase() as 'active' | 'completed' | 'cancelled',
        materielId: location.materielId,
        userId: location.userId,
        locationId: location.id,
        metadata: {
          materielName: materiel.name,
          userName: location.user.name,
          category: materiel.type,
          priority: location.status === 'ACTIVE' ? 'high' : 'medium',
          color: getEventColor(location.status, 'location')
        }
      }));

      // Ajouter les événements de maintenance si demandé
      if (includeMaintenance) {
        const maintenanceEvents = getMaintenanceEventsForDay(dayStart, materiel);
        dayEvents.push(...maintenanceEvents);
      }

      // Déterminer le statut de disponibilité
      let dayStatus: 'available' | 'rented' | 'maintenance' | 'reserved' = 'available';
      
      if (materiel.status === 'MAINTENANCE') {
        dayStatus = 'maintenance';
      } else if (dayEvents.some(event => event.type === 'maintenance')) {
        dayStatus = 'maintenance';
      } else if (dayEvents.some(event => event.type === 'location' && event.status === 'active')) {
        dayStatus = 'rented';
      } else if (dayEvents.some(event => event.type === 'reservation')) {
        dayStatus = 'reserved';
      }

      // Calculer les créneaux horaires si demandé
      let timeSlots: MaterialAvailability['timeSlots'] | undefined;
      if (showTimeSlots) {
        timeSlots = calculateTimeSlots(dayEvents, dayStart);
      }

      availability.push({
        date: new Date(dayStart),
        status: dayStatus,
        events: dayEvents,
        timeSlots
      });

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculer les statistiques de résumé
    const totalDays = availability.length;
    const availableDays = availability.filter(day => day.status === 'available').length;
    const rentedDays = availability.filter(day => day.status === 'rented').length;
    const maintenanceDays = availability.filter(day => day.status === 'maintenance').length;
    const reservedDays = availability.filter(day => day.status === 'reserved').length;
    const occupancyRate = totalDays > 0 ? ((rentedDays + reservedDays) / totalDays) * 100 : 0;

    // Trouver la prochaine date disponible
    const nextAvailableDate = availability.find(day => day.status === 'available')?.date;

    // Générer des recommandations
    const recommendations = {
      suggestedDates: availability
        .filter(day => day.status === 'available')
        .slice(0, 5)
        .map(day => day.date),
      alternativeMaterials: await findAlternativeMaterials(materiel.type, materielId)
    };

    const response: MaterialAvailabilityResponse = {
      success: true,
      data: {
        materielId: materiel.id,
        materielName: materiel.name,
        category: materiel.type,
        availability,
        summary: {
          totalDays,
          availableDays,
          rentedDays,
          maintenanceDays,
          reservedDays,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        },
        period: {
          start: startDate,
          end: endDate
        },
        nextAvailableDate,
        recommendations
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération de la disponibilité:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la récupération de la disponibilité' },
      { status: 500 }
    );
  }
}

/**
 * Calcule les dates de début et fin selon la période spécifiée
 */
function calculatePeriodDates(
  period: string,
  startDateParam?: string | null,
  endDateParam?: string | null
): { startDate: Date; endDate: Date } {
  const now = new Date();
  
  if (startDateParam && endDateParam) {
    return {
      startDate: new Date(startDateParam),
      endDate: new Date(endDateParam)
    };
  }

  switch (period) {
    case 'week': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return { startDate: startOfWeek, endDate: endOfWeek };
    }
    
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
      
      return { startDate: startOfQuarter, endDate: endOfQuarter };
    }
    
    case 'month':
    default: {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      return { startDate: startOfMonth, endDate: endOfMonth };
    }
  }
}

/**
 * Génère des événements de maintenance pour un jour donné
 */
function getMaintenanceEventsForDay(
  date: Date,
  materiel: { id: string; name: string; type: string }
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  
  // Maintenance préventive le 15 de chaque mois
  if (date.getDate() === 15) {
    const maintenanceStart = new Date(date);
    maintenanceStart.setHours(9, 0, 0, 0); // 9h00
    
    const maintenanceEnd = new Date(date);
    maintenanceEnd.setHours(11, 0, 0, 0); // 11h00
    
    events.push({
      id: `maintenance-${materiel.id}-${date.getTime()}`,
      title: `Maintenance - ${materiel.name}`,
      description: `Maintenance préventive pour ${materiel.name}`,
      startDate: maintenanceStart,
      endDate: maintenanceEnd,
      type: 'maintenance',
      status: 'active',
      materielId: materiel.id,
      metadata: {
        materielName: materiel.name,
        category: materiel.type,
        priority: 'medium',
        color: getEventColor('ACTIVE', 'maintenance')
      }
    });
  }
  
  return events;
}

/**
 * Calcule les créneaux horaires (matin/après-midi) pour un jour
 */
function calculateTimeSlots(
  events: CalendarEvent[],
  date: Date
): MaterialAvailability['timeSlots'] {
  const morningStart = new Date(date);
  morningStart.setHours(8, 0, 0, 0);
  const morningEnd = new Date(date);
  morningEnd.setHours(12, 0, 0, 0);
  
  const afternoonStart = new Date(date);
  afternoonStart.setHours(12, 0, 0, 0);
  const afternoonEnd = new Date(date);
  afternoonEnd.setHours(18, 0, 0, 0);
  
  // Vérifier les occupations pour chaque créneau
  const morningOccupied = events.some(event => 
    (event.startDate <= morningEnd && event.endDate >= morningStart) &&
    (event.type === 'location' || event.type === 'maintenance')
  );
  
  const afternoonOccupied = events.some(event => 
    (event.startDate <= afternoonEnd && event.endDate >= afternoonStart) &&
    (event.type === 'location' || event.type === 'maintenance')
  );
  
  return {
    morning: morningOccupied ? 'occupied' : 'available',
    afternoon: afternoonOccupied ? 'occupied' : 'available',
    fullDay: (morningOccupied && afternoonOccupied) ? 'occupied' : 'available'
  };
}

/**
 * Trouve des matériels alternatifs du même type
 */
async function findAlternativeMaterials(
  materielType: string,
  excludeMaterielId: string
): Promise<string[]> {
  const alternatives = await prisma.materiel.findMany({
    where: {
      id: { not: excludeMaterielId },
      status: 'AVAILABLE'
    },
    select: {
      id: true
    },
    take: 3 // Limiter à 3 alternatives
  });
  
  return alternatives.map(alt => alt.id);
}

/**
 * Détermine la couleur d'un événement selon son statut et type
 */
function getEventColor(status: string, type: string): string {
  if (type === 'maintenance') {
    return '#FF9800'; // Orange pour maintenance
  }
  
  if (type === 'reservation') {
    return '#2196F3'; // Bleu pour réservation
  }

  // Couleurs pour les locations
  switch (status) {
    case 'ACTIVE':
      return '#4CAF50'; // Vert pour actif
    case 'COMPLETED':
      return '#757575'; // Gris pour terminé
    case 'CANCELLED':
      return '#F44336'; // Rouge pour annulé
    default:
      return '#607D8B'; // Bleu-gris par défaut
  }
}
