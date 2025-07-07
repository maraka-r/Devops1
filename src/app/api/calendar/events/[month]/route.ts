import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { CalendarEvent, CalendarEventsResponse } from '@/types';

const prisma = new PrismaClient();

/**
 * GET /api/calendar/events/[month]
 * Récupère les événements du calendrier pour un mois spécifique
 * 
 * Paramètres d'URL :
 * - month : Format YYYY-MM (ex: 2024-03)
 * 
 * Paramètres de requête :
 * - userId (optionnel) : Filtrer par utilisateur
 * - materielId (optionnel) : Filtrer par matériel
 * - type (optionnel) : Filtrer par type d'événement
 * - status (optionnel) : Filtrer par statut
 * - includeMaintenance (optionnel) : Inclure les événements de maintenance
 * - includeReservations (optionnel) : Inclure les réservations
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ month: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { month } = await context.params;
    
    // Validation et parsing du mois
    const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
    if (!monthMatch) {
      return NextResponse.json(
        { success: false, error: 'Format de mois invalide. Utilisez YYYY-MM (ex: 2024-03)' },
        { status: 400 }
      );
    }

    const year = parseInt(monthMatch[1]);
    const monthNum = parseInt(monthMatch[2]);

    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { success: false, error: 'Mois invalide. Doit être entre 01 et 12' },
        { status: 400 }
      );
    }

    // Calculer les dates de début et fin du mois
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Paramètres de requête
    const userId = searchParams.get('userId');
    const materielId = searchParams.get('materielId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const includeMaintenance = searchParams.get('includeMaintenance') === 'true';
    const includeReservations = searchParams.get('includeReservations') === 'true';

    // Construction des filtres pour les locations
    let whereClause = {};
    
    // Filtre de base par période
    const periodFilter = {
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
    };

    // Construction progressive des filtres
    if (userId && materielId && status) {
      whereClause = {
        AND: [
          periodFilter,
          { userId },
          { materielId },
          { status }
        ]
      };
    } else if (userId && materielId) {
      whereClause = {
        AND: [
          periodFilter,
          { userId },
          { materielId }
        ]
      };
    } else if (userId && status) {
      whereClause = {
        AND: [
          periodFilter,
          { userId },
          { status }
        ]
      };
    } else if (materielId && status) {
      whereClause = {
        AND: [
          periodFilter,
          { materielId },
          { status }
        ]
      };
    } else if (userId) {
      whereClause = {
        AND: [
          periodFilter,
          { userId }
        ]
      };
    } else if (materielId) {
      whereClause = {
        AND: [
          periodFilter,
          { materielId }
        ]
      };
    } else if (status) {
      whereClause = {
        AND: [
          periodFilter,
          { status }
        ]
      };
    } else {
      whereClause = periodFilter;
    }

    // Récupération des locations
    const locations = await prisma.location.findMany({
      where: whereClause,
      include: {
        materiel: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Conversion des locations en événements calendrier
    const events: CalendarEvent[] = locations.map(location => ({
      id: location.id,
      title: `Location - ${location.materiel.name}`,
      description: `Location de ${location.materiel.name} par ${location.user.name}`,
      startDate: location.startDate,
      endDate: location.endDate,
      type: 'location',
      status: location.status.toLowerCase() as 'active' | 'completed' | 'cancelled',
      materielId: location.materielId,
      userId: location.userId,
      locationId: location.id,
      metadata: {
        materielName: location.materiel.name,
        userName: location.user.name,
        category: location.materiel.type,
        priority: location.status === 'ACTIVE' ? 'high' : 'medium',
        color: getEventColor(location.status, 'location')
      }
    }));

    // Ajouter les événements de maintenance si demandé
    if (includeMaintenance) {
      const maintenanceEvents = await generateMaintenanceEvents(startDate, endDate, materielId || undefined);
      events.push(...maintenanceEvents);
    }

    // Ajouter les réservations si demandé
    if (includeReservations) {
      const reservationEvents = await generateReservationEvents();
      events.push(...reservationEvents);
    }

    // Filtrer par type si spécifié
    const filteredEvents = type ? events.filter(event => event.type === type) : events;

    // Trier les événements par date
    filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Calculer le résumé
    const summary = {
      total: filteredEvents.length,
      byType: {
        location: filteredEvents.filter(e => e.type === 'location').length,
        maintenance: filteredEvents.filter(e => e.type === 'maintenance').length,
        reservation: filteredEvents.filter(e => e.type === 'reservation').length,
        holiday: filteredEvents.filter(e => e.type === 'holiday').length
      },
      byStatus: {
        active: filteredEvents.filter(e => e.status === 'active').length,
        completed: filteredEvents.filter(e => e.status === 'completed').length,
        cancelled: filteredEvents.filter(e => e.status === 'cancelled').length
      }
    };

    // Nom du mois pour la réponse
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const response: CalendarEventsResponse = {
      success: true,
      data: {
        events: filteredEvents,
        summary,
        period: {
          start: startDate,
          end: endDate,
          monthName: `${monthNames[monthNum - 1]} ${year}`
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des événements du mois:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la récupération des événements' },
      { status: 500 }
    );
  }
}

/**
 * Génère des événements de maintenance simulés pour un mois
 */
async function generateMaintenanceEvents(
  startDate: Date,
  endDate: Date,
  materielId?: string
): Promise<CalendarEvent[]> {
  const materiels = await prisma.materiel.findMany({
    where: materielId ? { id: materielId } : {},
    select: {
      id: true,
      name: true,
      type: true,
      createdAt: true
    }
  });

  const maintenanceEvents: CalendarEvent[] = [];

  // Générer des événements de maintenance préventive
  for (const materiel of materiels) {
    const maintenanceDate = new Date(startDate);
    maintenanceDate.setDate(15); // Maintenance le 15 de chaque mois

    if (maintenanceDate >= startDate && maintenanceDate <= endDate) {
      maintenanceEvents.push({
        id: `maintenance-${materiel.id}-${maintenanceDate.getTime()}`,
        title: `Maintenance - ${materiel.name}`,
        description: `Maintenance préventive pour ${materiel.name}`,
        startDate: maintenanceDate,
        endDate: new Date(maintenanceDate.getTime() + 2 * 60 * 60 * 1000), // 2 heures
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
  }

  return maintenanceEvents;
}

/**
 * Génère des événements de réservation simulés pour un mois
 */
async function generateReservationEvents(): Promise<CalendarEvent[]> {
  const reservationEvents: CalendarEvent[] = [];
  // Simulation de réservations - à implémenter selon les besoins
  return reservationEvents;
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
