// Hook pour la gestion des locations
// CRUD, recherche, filtres, statistiques

'use client';

import { useState, useCallback } from 'react';
import { apiService, ApiError } from '@/lib/api';
import { 
  Location, 
  LocationWithDetails,
  LocationSearchResponse,
  LocationSearchFilters,
  CreateLocationRequest,
  UpdateLocationRequest,
  PaginatedResponse
} from '@/types';

// Types pour le hook
interface UseLocationsOptions {
  initialFilters?: LocationSearchFilters;
}

interface UseLocationsReturn {
  // État
  locations: Location[];
  locationsWithDetails: LocationWithDetails[];
  isLoading: boolean;
  error: string | null;
  
  // Recherche et pagination
  searchResults: LocationSearchResponse['data'] | null;
  totalCount: number;
  currentPage: number;
  
  // Actions CRUD
  fetchLocations: (filters?: LocationSearchFilters) => Promise<void>;
  fetchLocationsWithDetails: (filters?: LocationSearchFilters) => Promise<void>;
  searchLocations: (filters: LocationSearchFilters) => Promise<void>;
  createLocation: (data: CreateLocationRequest) => Promise<Location>;
  updateLocation: (id: string, data: UpdateLocationRequest) => Promise<Location>;
  deleteLocation: (id: string) => Promise<void>;
  getLocation: (id: string) => Promise<Location>;
  getLocationWithDetails: (id: string) => Promise<LocationWithDetails>;
  
  // Actions spécifiques
  getActiveLocations: () => Promise<void>;
  getUpcomingLocations: () => Promise<void>;
  getLocationsByMaterial: (materielId: string) => Promise<void>;
  getLocationsByUser: (userId: string) => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  refreshLocations: () => Promise<void>;
}

export function useLocations(options: UseLocationsOptions = {}): UseLocationsReturn {
  const { initialFilters = {} } = options;
  
  // État local
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsWithDetails, setLocationsWithDetails] = useState<LocationWithDetails[]>([]);
  const [searchResults, setSearchResults] = useState<LocationSearchResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fonction pour nettoyer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fonction pour récupérer la liste des locations
  const fetchLocations = useCallback(async (filters: LocationSearchFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<PaginatedResponse<Location>>('/locations', {
        params: filters as Record<string, string | number | boolean>
      });
      
      if (response.success && response.data) {
        setLocations(response.data.data);
        setTotalCount(response.data.pagination.total);
        setCurrentPage(response.data.pagination.page);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des locations';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les locations avec détails
  const fetchLocationsWithDetails = useCallback(async (filters: LocationSearchFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<PaginatedResponse<LocationWithDetails>>('/locations/details', {
        params: filters as Record<string, string | number | boolean>
      });
      
      if (response.success && response.data) {
        setLocationsWithDetails(response.data.data);
        setTotalCount(response.data.pagination.total);
        setCurrentPage(response.data.pagination.page);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des locations avec détails';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour la recherche avancée
  const searchLocations = useCallback(async (filters: LocationSearchFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<LocationSearchResponse['data']>('/search/locations', {
        params: filters as Record<string, string | number | boolean>
      });
      
      if (response.success && response.data) {
        setSearchResults(response.data);
        setTotalCount(response.data.pagination.total);
        setCurrentPage(response.data.pagination.page);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la recherche';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour créer une location
  const createLocation = useCallback(async (data: CreateLocationRequest): Promise<Location> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.post<Location>('/locations', data);
      
      if (response.success && response.data) {
        // Ajouter la nouvelle location à la liste
        setLocations(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        throw new ApiError(response.error || 'Erreur lors de la création', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la création de la location';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour mettre à jour une location
  const updateLocation = useCallback(async (id: string, data: UpdateLocationRequest): Promise<Location> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.put<Location>(`/locations/${id}`, data);
      
      if (response.success && response.data) {
        // Mettre à jour la location dans la liste
        setLocations(prev => 
          prev.map(location => 
            location.id === id ? response.data! : location
          )
        );
        return response.data;
      } else {
        throw new ApiError(response.error || 'Erreur lors de la mise à jour', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour de la location';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour supprimer une location
  const deleteLocation = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.delete(`/locations/${id}`);
      
      if (response.success) {
        // Retirer la location de la liste
        setLocations(prev => prev.filter(location => location.id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
      } else {
        throw new ApiError(response.error || 'Erreur lors de la suppression', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la suppression de la location';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer une location spécifique
  const getLocation = useCallback(async (id: string): Promise<Location> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<Location>(`/locations/${id}`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new ApiError(response.error || 'Location non trouvée', 404);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement de la location';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer une location avec détails
  const getLocationWithDetails = useCallback(async (id: string): Promise<LocationWithDetails> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<LocationWithDetails>(`/locations/${id}/details`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new ApiError(response.error || 'Location non trouvée', 404);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement de la location avec détails';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les locations actives
  const getActiveLocations = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<Location[]>('/locations/active');
      
      if (response.success && response.data) {
        setLocations(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des locations actives';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les locations à venir
  const getUpcomingLocations = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<Location[]>('/locations/upcoming');
      
      if (response.success && response.data) {
        setLocations(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des locations à venir';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les locations par matériel
  const getLocationsByMaterial = useCallback(async (materielId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<Location[]>(`/locations/by-material/${materielId}`);
      
      if (response.success && response.data) {
        setLocations(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des locations du matériel';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les locations par utilisateur
  const getLocationsByUser = useCallback(async (userId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<Location[]>(`/locations/by-user/${userId}`);
      
      if (response.success && response.data) {
        setLocations(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des locations de l\'utilisateur';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour rafraîchir les locations
  const refreshLocations = useCallback(async (): Promise<void> => {
    await fetchLocations(initialFilters);
  }, [fetchLocations, initialFilters]);

  return {
    // État
    locations,
    locationsWithDetails,
    isLoading,
    error,
    
    // Recherche et pagination
    searchResults,
    totalCount,
    currentPage,
    
    // Actions CRUD
    fetchLocations,
    fetchLocationsWithDetails,
    searchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    getLocation,
    getLocationWithDetails,
    
    // Actions spécifiques
    getActiveLocations,
    getUpcomingLocations,
    getLocationsByMaterial,
    getLocationsByUser,
    
    // Utilitaires
    clearError,
    refreshLocations,
  };
}
