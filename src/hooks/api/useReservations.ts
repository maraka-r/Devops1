// Hook pour la gestion des réservations
// CRUD, recherche, changement de statut

'use client';

import { useState, useCallback } from 'react';
import { apiService } from '@/lib/api';
import { 
  LocationStatus
} from '@/types';

// Types simplifiés pour les réservations avec mocks
interface SimpleLocation {
  id: string;
  userId: string;
  materielId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: LocationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  materiel?: {
    id: string;
    name: string;
    type: string;
    pricePerDay: number;
    status: string;
    images: string[];
  };
}

interface LocationSearchFilters {
  query?: string;
  status?: LocationStatus | LocationStatus[];
  userId?: string;
  materielId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Mock data pour développement (fallback si API indisponible)
const mockReservations: SimpleLocation[] = [
  {
    id: 'mock-reservation-1',
    userId: 'mock-user-1',
    materielId: 'mock-materiel-1',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
    totalPrice: 450.00,
    status: 'PENDING',
    notes: 'Réservation en attente de validation',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'mock-user-1',
      name: 'Jean Martin',
      email: 'jean.martin@entreprise-martin.fr',
      company: 'Entreprise Martin',
      phone: '+33 1 11 22 33 44',
    },
    materiel: {
      id: 'mock-materiel-1',
      name: 'Grue mobile Liebherr LTM 1030-2.1',
      type: 'GRUE_MOBILE',
      pricePerDay: 450.00,
      status: 'AVAILABLE',
      images: ['/images/materiels/grue-liebherr-1.jpg'],
    },
  },
  {
    id: 'mock-reservation-2',
    userId: 'mock-user-2',
    materielId: 'mock-materiel-2',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Dans 10 jours
    totalPrice: 960.00,
    status: 'CONFIRMED',
    notes: 'Réservation confirmée pour projet urbain',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'mock-user-2',
      name: 'Sophie Bernard',
      email: 'sophie.bernard@btp-solutions.fr',
      company: 'BTP Solutions',
      phone: '+33 1 55 66 77 88',
    },
    materiel: {
      id: 'mock-materiel-2',
      name: 'Pelleteuse Komatsu PC210LC-11',
      type: 'PELLETEUSE',
      pricePerDay: 320.00,
      status: 'AVAILABLE',
      images: ['/images/materiels/pelleteuse-komatsu-1.jpg'],
    },
  },
];

interface UpdateReservationRequest {
  status?: LocationStatus;
  notes?: string;
  startDate?: Date;
  endDate?: Date;
}

interface UseReservationsOptions {
  initialFilters?: LocationSearchFilters;
}

interface UseReservationsReturn {
  // État
  reservations: SimpleLocation[];
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
  
  // Actions CRUD
  fetchReservations: (filters?: LocationSearchFilters) => Promise<void>;
  getReservation: (id: string) => Promise<SimpleLocation | null>;
  updateReservation: (id: string, data: UpdateReservationRequest) => Promise<SimpleLocation>;
  cancelReservation: (id: string, reason?: string) => Promise<void>;
  confirmReservation: (id: string) => Promise<SimpleLocation>;
  
  // Actions spécifiques
  getPendingReservations: () => Promise<void>;
  getUpcomingReservations: () => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  refreshReservations: () => Promise<void>;
}

export function useReservations(options: UseReservationsOptions = {}): UseReservationsReturn {
  const { initialFilters = {} } = options;
  
  // État local
  const [reservations, setReservations] = useState<SimpleLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Fonction pour nettoyer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fonction pour récupérer les réservations
  const fetchReservations = useCallback(async (filters: LocationSearchFilters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      // Essayer l'API d'abord
      const response = await apiService.get('/api/locations/reservations', {
        params: filters,
      });

      if (response.data?.items) {
        if (filters.page === 1) {
          setReservations(response.data.items);
        } else {
          setReservations(prev => [...prev, ...response.data.items]);
        }
        setCurrentPage(response.data.pagination?.page || 1);
        setTotalCount(response.data.pagination?.total || 0);
        setHasNextPage(response.data.pagination?.hasNext || false);
      }

    } catch {
      console.log('API non disponible, utilisation des mocks pour les réservations');
      
      // Fallback sur les mocks avec filtrage
      let filteredMocks = mockReservations;
      
      if (filters.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        filteredMocks = mockReservations.filter(res => 
          statusArray.includes(res.status)
        );
      }

      setReservations(filteredMocks);
      setTotalCount(filteredMocks.length);
      setCurrentPage(1);
      setHasNextPage(false);
    }

    setIsLoading(false);
  }, []);

  // Fonction pour récupérer une réservation spécifique
  const getReservation = useCallback(async (id: string): Promise<SimpleLocation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.get(`/api/locations/${id}`);
      return response.data || null;
    } catch {
      console.log('API non disponible, recherche dans les mocks');
      const mockReservation = mockReservations.find(res => res.id === id);
      return mockReservation || null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour mettre à jour une réservation
  const updateReservation = useCallback(async (id: string, data: UpdateReservationRequest): Promise<SimpleLocation> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.put(`/api/locations/${id}`, data);
      
      if (response.data) {
        // Mettre à jour dans la liste locale
        setReservations(prev => prev.map(res => 
          res.id === id ? response.data : res
        ));
        return response.data;
      }
      
      throw new Error('Pas de données dans la réponse');
    } catch {
      console.log('API non disponible, simulation de la mise à jour');
      
      // Simulation avec les mocks
      const mockReservation = mockReservations.find(res => res.id === id);
      if (mockReservation) {
        const updated = { ...mockReservation, ...data };
        setReservations(prev => prev.map(res => 
          res.id === id ? updated : res
        ));
        return updated;
      }
      
      throw new Error('Réservation non trouvée');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour annuler une réservation
  const cancelReservation = useCallback(async (id: string, reason?: string) => {
    await updateReservation(id, { 
      status: 'CANCELLED',
      notes: reason ? `Annulée: ${reason}` : 'Annulée'
    });
  }, [updateReservation]);

  // Fonction pour confirmer une réservation
  const confirmReservation = useCallback(async (id: string): Promise<SimpleLocation> => {
    return await updateReservation(id, { status: 'CONFIRMED' });
  }, [updateReservation]);

  // Fonction pour récupérer les réservations en attente
  const getPendingReservations = useCallback(async () => {
    await fetchReservations({ status: 'PENDING' });
  }, [fetchReservations]);

  // Fonction pour récupérer les réservations à venir
  const getUpcomingReservations = useCallback(async () => {
    await fetchReservations({ 
      status: 'CONFIRMED' as LocationStatus
    });
  }, [fetchReservations]);

  // Fonction pour rafraîchir les données
  const refreshReservations = useCallback(async () => {
    await fetchReservations(initialFilters);
  }, [fetchReservations, initialFilters]);

  return {
    // État
    reservations,
    isLoading,
    error,
    
    // Pagination
    totalCount,
    currentPage,
    hasNextPage,
    
    // Actions CRUD
    fetchReservations,
    getReservation,
    updateReservation,
    cancelReservation,
    confirmReservation,
    
    // Actions spécifiques
    getPendingReservations,
    getUpcomingReservations,
    
    // Utilitaires
    clearError,
    refreshReservations,
  };
}
