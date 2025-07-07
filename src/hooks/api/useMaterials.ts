// Hook pour la gestion des matériels
// CRUD, recherche, filtres

'use client';

import { useState, useCallback } from 'react';
import { apiService, ApiError } from '@/lib/api';
import { 
  Materiel, 
  MaterialSearchResponse,
  MaterialSearchFilters,
  CreateMaterielRequest,
  UpdateMaterielRequest,
  MaterielType,
  PaginatedResponse
} from '@/types';

// Types pour le hook
interface UseMaterialsOptions {
  autoFetch?: boolean;
  initialFilters?: MaterialSearchFilters;
}

interface UseMaterialsReturn {
  // État
  materials: Materiel[];
  isLoading: boolean;
  error: string | null;
  
  // Recherche et pagination
  searchResults: MaterialSearchResponse['data'] | null;
  totalCount: number;
  currentPage: number;
  
  // Actions CRUD
  fetchMaterials: (filters?: MaterialSearchFilters) => Promise<void>;
  searchMaterials: (filters: MaterialSearchFilters) => Promise<void>;
  createMaterial: (data: CreateMaterielRequest) => Promise<Materiel>;
  updateMaterial: (id: string, data: UpdateMaterielRequest) => Promise<Materiel>;
  deleteMaterial: (id: string) => Promise<void>;
  getMaterial: (id: string) => Promise<Materiel>;
  
  // Actions spécifiques
  getAvailableMaterials: () => Promise<void>;
  getMaterialCategories: () => Promise<MaterielType[]>;
  
  // Utilitaires
  clearError: () => void;
  refreshMaterials: () => Promise<void>;
}

export function useMaterials(options: UseMaterialsOptions = {}): UseMaterialsReturn {
  const { initialFilters = {} } = options;
  
  // État local
  const [materials, setMaterials] = useState<Materiel[]>([]);
  const [searchResults, setSearchResults] = useState<MaterialSearchResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fonction pour nettoyer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fonction pour récupérer la liste des matériels
  const fetchMaterials = useCallback(async (filters: MaterialSearchFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<PaginatedResponse<Materiel>>('/materiels', {
        params: filters as Record<string, string | number | boolean>
      });
      
      if (response.success && response.data) {
        setMaterials(response.data.data);
        setTotalCount(response.data.pagination.total);
        setCurrentPage(response.data.pagination.page);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des matériels';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour la recherche avancée
  const searchMaterials = useCallback(async (filters: MaterialSearchFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<MaterialSearchResponse['data']>('/search/materials', {
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

  // Fonction pour créer un matériel
  const createMaterial = useCallback(async (data: CreateMaterielRequest): Promise<Materiel> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.post<Materiel>('/materiels', data);
      
      if (response.success && response.data) {
        // Ajouter le nouveau matériel à la liste
        setMaterials(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        throw new ApiError(response.error || 'Erreur lors de la création', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la création du matériel';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour mettre à jour un matériel
  const updateMaterial = useCallback(async (id: string, data: UpdateMaterielRequest): Promise<Materiel> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.put<Materiel>(`/materiels/${id}`, data);
      
      if (response.success && response.data) {
        // Mettre à jour le matériel dans la liste
        setMaterials(prev => 
          prev.map(material => 
            material.id === id ? response.data! : material
          )
        );
        return response.data;
      } else {
        throw new ApiError(response.error || 'Erreur lors de la mise à jour', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour du matériel';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour supprimer un matériel
  const deleteMaterial = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.delete(`/materiels/${id}`);
      
      if (response.success) {
        // Retirer le matériel de la liste
        setMaterials(prev => prev.filter(material => material.id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
      } else {
        throw new ApiError(response.error || 'Erreur lors de la suppression', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la suppression du matériel';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer un matériel spécifique
  const getMaterial = useCallback(async (id: string): Promise<Materiel> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<Materiel>(`/materiels/${id}`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new ApiError(response.error || 'Matériel non trouvé', 404);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement du matériel';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les matériels disponibles
  const getAvailableMaterials = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<Materiel[]>('/materiels/available');
      
      if (response.success && response.data) {
        setMaterials(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des matériels disponibles';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les catégories de matériels
  const getMaterialCategories = useCallback(async (): Promise<MaterielType[]> => {
    try {
      const response = await apiService.get<MaterielType[]>('/materiels/categories');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new ApiError(response.error || 'Erreur lors du chargement des catégories', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des catégories';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Fonction pour rafraîchir les matériels
  const refreshMaterials = useCallback(async (): Promise<void> => {
    await fetchMaterials(initialFilters);
  }, [fetchMaterials, initialFilters]);

  // Chargement automatique si activé
  // useEffect(() => {
  //   if (autoFetch) {
  //     fetchMaterials(initialFilters);
  //   }
  // }, [autoFetch, fetchMaterials, initialFilters]);

  return {
    // État
    materials,
    isLoading,
    error,
    
    // Recherche et pagination
    searchResults,
    totalCount,
    currentPage,
    
    // Actions CRUD
    fetchMaterials,
    searchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterial,
    
    // Actions spécifiques
    getAvailableMaterials,
    getMaterialCategories,
    
    // Utilitaires
    clearError,
    refreshMaterials,
  };
}
