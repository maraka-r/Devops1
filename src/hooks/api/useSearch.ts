// Hook générique pour la recherche
// Recherche unifiée de matériels, clients et locations

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiService, ApiError } from '@/lib/api';
import { 
  MaterialSearchResponse,
  ClientSearchResponse,
  LocationSearchResponse,
  MaterialSearchFilters,
  ClientSearchFilters,
  LocationSearchFilters,
  SearchStats
} from '@/types';

// Types pour le hook
type SearchCategory = 'materials' | 'clients' | 'locations';

interface UseSearchReturn {
  // État global
  isSearching: boolean;
  error: string | null;
  searchStats: SearchStats | null;
  
  // Recherche par catégorie
  materialResults: MaterialSearchResponse['data'] | null;
  clientResults: ClientSearchResponse['data'] | null;
  locationResults: LocationSearchResponse['data'] | null;
  
  // Actions de recherche
  searchMaterials: (filters: MaterialSearchFilters) => Promise<void>;
  searchClients: (filters: ClientSearchFilters) => Promise<void>;
  searchLocations: (filters: LocationSearchFilters) => Promise<void>;
  searchAll: (query: string) => Promise<void>;
  
  // Autocomplétion et suggestions
  getSuggestions: (query: string, category?: SearchCategory) => Promise<string[]>;
  getAutoComplete: (query: string, category: SearchCategory) => Promise<string[]>;
  
  // Historique et statistiques
  getSearchHistory: () => Promise<void>;
  getSearchStats: () => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  clearResults: () => void;
  clearCategory: (category: SearchCategory) => void;
}

export function useSearch(): UseSearchReturn {
  // État local
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  
  // Résultats par catégorie
  const [materialResults, setMaterialResults] = useState<MaterialSearchResponse['data'] | null>(null);
  const [clientResults, setClientResults] = useState<ClientSearchResponse['data'] | null>(null);
  const [locationResults, setLocationResults] = useState<LocationSearchResponse['data'] | null>(null);
  
  // Debounce pour les recherches
  const [searchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fonction pour nettoyer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fonction pour nettoyer tous les résultats
  const clearResults = useCallback(() => {
    setMaterialResults(null);
    setClientResults(null);
    setLocationResults(null);
  }, []);

  // Fonction pour nettoyer une catégorie spécifique
  const clearCategory = useCallback((category: SearchCategory) => {
    switch (category) {
      case 'materials':
        setMaterialResults(null);
        break;
      case 'clients':
        setClientResults(null);
        break;
      case 'locations':
        setLocationResults(null);
        break;
    }
  }, []);

  // Fonction pour rechercher des matériels
  const searchMaterials = useCallback(async (filters: MaterialSearchFilters) => {
    try {
      setIsSearching(true);
      setError(null);
      
      const response = await apiService.get<MaterialSearchResponse['data']>('/search/materials', {
        params: filters as Record<string, string | number | boolean>
      });
      
      if (response.success && response.data) {
        setMaterialResults(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la recherche de matériels';
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Fonction pour rechercher des clients
  const searchClients = useCallback(async (filters: ClientSearchFilters) => {
    try {
      setIsSearching(true);
      setError(null);
      
      const response = await apiService.get<ClientSearchResponse['data']>('/search/clients', {
        params: filters as Record<string, string | number | boolean>
      });
      
      if (response.success && response.data) {
        setClientResults(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la recherche de clients';
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Fonction pour rechercher des locations
  const searchLocations = useCallback(async (filters: LocationSearchFilters) => {
    try {
      setIsSearching(true);
      setError(null);
      
      const response = await apiService.get<LocationSearchResponse['data']>('/search/locations', {
        params: filters as Record<string, string | number | boolean>
      });
      
      if (response.success && response.data) {
        setLocationResults(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la recherche de locations';
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Fonction pour rechercher dans toutes les catégories
  const searchAll = useCallback(async (query: string) => {
    try {
      setIsSearching(true);
      setError(null);
      
      // Recherche parallèle dans toutes les catégories
      const [materialResponse, clientResponse, locationResponse] = await Promise.allSettled([
        apiService.get<MaterialSearchResponse['data']>('/search/materials', {
          params: { query } as Record<string, string | number | boolean>
        }),
        apiService.get<ClientSearchResponse['data']>('/search/clients', {
          params: { query } as Record<string, string | number | boolean>
        }),
        apiService.get<LocationSearchResponse['data']>('/search/locations', {
          params: { query } as Record<string, string | number | boolean>
        })
      ]);
      
      // Traitement des résultats
      if (materialResponse.status === 'fulfilled' && materialResponse.value.success) {
        setMaterialResults(materialResponse.value.data || null);
      }
      
      if (clientResponse.status === 'fulfilled' && clientResponse.value.success) {
        setClientResults(clientResponse.value.data || null);
      }
      
      if (locationResponse.status === 'fulfilled' && locationResponse.value.success) {
        setLocationResults(locationResponse.value.data || null);
      }
      
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la recherche globale';
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Fonction pour obtenir des suggestions
  const getSuggestions = useCallback(async (query: string, category?: SearchCategory): Promise<string[]> => {
    try {
      const endpoint = category 
        ? `/search/suggestions/${category}` 
        : '/search/suggestions';
      
      const response = await apiService.get<string[]>(endpoint, {
        params: { query } as Record<string, string | number | boolean>
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (err) {
      console.error('Erreur lors du chargement des suggestions:', err);
      return [];
    }
  }, []);

  // Fonction pour l'autocomplétion
  const getAutoComplete = useCallback(async (query: string, category: SearchCategory): Promise<string[]> => {
    try {
      const response = await apiService.get<string[]>(`/search/autocomplete/${category}`, {
        params: { query } as Record<string, string | number | boolean>
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (err) {
      console.error('Erreur lors de l\'autocomplétion:', err);
      return [];
    }
  }, []);

  // Fonction pour récupérer l'historique de recherche
  const getSearchHistory = useCallback(async (): Promise<void> => {
    try {
      const response = await apiService.get<SearchStats>('/search/history');
      
      if (response.success && response.data) {
        setSearchStats(response.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err);
    }
  }, []);

  // Fonction pour récupérer les statistiques de recherche
  const getSearchStats = useCallback(async (): Promise<void> => {
    try {
      const response = await apiService.get<SearchStats>('/search/stats');
      
      if (response.success && response.data) {
        setSearchStats(response.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, []);

  // Fonction pour nettoyer l'historique
  const clearSearchHistory = useCallback(async (): Promise<void> => {
    try {
      await apiService.delete('/search/history');
      setSearchStats(null);
    } catch (err) {
      console.error('Erreur lors du nettoyage de l\'historique:', err);
    }
  }, []);

  // Nettoyage du timeout à la destruction
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return {
    // État global
    isSearching,
    error,
    searchStats,
    
    // Recherche par catégorie
    materialResults,
    clientResults,
    locationResults,
    
    // Actions de recherche
    searchMaterials,
    searchClients,
    searchLocations,
    searchAll,
    
    // Autocomplétion et suggestions
    getSuggestions,
    getAutoComplete,
    
    // Historique et statistiques
    getSearchHistory,
    getSearchStats,
    clearSearchHistory,
    
    // Utilitaires
    clearError,
    clearResults,
    clearCategory,
  };
}
