// Données mock pour le développement frontend
// Utiliser en cas de non disponibilité des endpoints API

import { Location, LocationStatus } from '@/types';
import { addDays, subDays } from 'date-fns';

// Générer des dates relatives par rapport à aujourd'hui
const today = new Date();
const tomorrow = addDays(today, 1);
const nextWeek = addDays(today, 7);
const lastWeek = subDays(today, 7);
const lastMonth = subDays(today, 30);

// Mock locations pour les tests
export const mockLocations: Location[] = [
  {
    id: 'loc1',
    materielId: 'mat1',
    userId: 'user1',
    startDate: lastWeek,
    endDate: tomorrow,
    status: LocationStatus.ACTIVE,
    totalPrice: 2500 as any, // Decimal dans Prisma, mais number ici
    notes: "Projet construction résidentielle",
    createdAt: lastMonth,
    updatedAt: lastMonth
  },
  {
    id: 'loc2',
    materielId: 'mat2',
    userId: 'user2',
    startDate: today,
    endDate: nextWeek,
    status: LocationStatus.ACTIVE,
    totalPrice: 3500 as any, // Decimal dans Prisma
    notes: "Rénovation bâtiment commercial",
    createdAt: lastWeek,
    updatedAt: lastWeek
  },
  {
    id: 'loc3',
    materielId: 'mat3',
    userId: 'user1',
    startDate: tomorrow,
    endDate: addDays(tomorrow, 5),
    status: LocationStatus.CONFIRMED,
    totalPrice: 1500,
    notes: null,
    createdAt: today,
    updatedAt: today
  }
];

// Fonction pour récupérer les locations mock d'un matériel
export function getMockLocationsByMaterielId(materielId: string): Location[] {
  return mockLocations.filter(loc => loc.materielId === materielId);
}

// Fonction pour vérifier si un matériel est actuellement loué
export function isMaterielRented(materielId: string): boolean {
  const now = new Date();
  return mockLocations.some(loc => 
    loc.materielId === materielId && 
    (loc.status === LocationStatus.ACTIVE || loc.status === LocationStatus.CONFIRMED) &&
    new Date(loc.startDate) <= now && 
    new Date(loc.endDate) >= now
  );
}

// Fonction pour calculer la date de disponibilité d'un matériel
export function getMockAvailabilityDate(materielId: string): Date | null {
  const activeLocations = mockLocations.filter(loc => 
    loc.materielId === materielId && 
    (loc.status === LocationStatus.ACTIVE || loc.status === LocationStatus.CONFIRMED)
  );
  
  if (activeLocations.length === 0) {
    return null;
  }
  
  const latestEndDate = activeLocations.reduce((latest, loc) => {
    const endDate = new Date(loc.endDate);
    return endDate > latest ? endDate : latest;
  }, new Date(activeLocations[0].endDate));
  
  return addDays(latestEndDate, 1); // Ajouter un jour pour maintenance
}
