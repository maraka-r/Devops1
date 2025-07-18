// Hook pour la gestion des clients/utilisateurs
// CRUD, recherche, statistiques

'use client';

import { useState, useCallback } from 'react';
import { apiService, ApiError } from '@/lib/api';
import { 
  User, 
  ClientSearchResponse,
  ClientSearchFilters,
  // PaginatedResponse,
  UserRole,
  UserStatus,
  // ApiResponse
} from '@/types';

// Types pour les statistiques client
interface ClientStats {
  totalLocations: number;
  totalSpent: number;
  lastLocationDate?: string;
  averageOrderValue: number;
  favoriteCategories: string[];
  locationsByMonth: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
}
interface CreateClientRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  role?: UserRole;
  status?: UserStatus;
}

interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: UserRole;
  status?: UserStatus;
}

// Types pour le hook
interface UseClientsOptions {
  initialFilters?: ClientSearchFilters;
}

interface UseClientsReturn {
  // État
  clients: Omit<User, 'password'>[];
  isLoading: boolean;
  error: string | null;
  
  // Recherche et pagination
  searchResults: ClientSearchResponse['data'] | null;
  totalCount: number;
  currentPage: number;
  
  // Actions CRUD
  fetchClients: (filters?: ClientSearchFilters) => Promise<void>;
  searchClients: (filters: ClientSearchFilters) => Promise<void>;
  createClient: (data: CreateClientRequest) => Promise<Omit<User, 'password'>>;
  updateClient: (id: string, data: UpdateClientRequest) => Promise<Omit<User, 'password'>>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Promise<Omit<User, 'password'>>;
  
  // Actions spécifiques
  getActiveClients: () => Promise<void>;
  getClientStats: (id: string) => Promise<ClientStats>;
  updateClientStatus: (id: string, status: UserStatus) => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  refreshClients: () => Promise<void>;
}

export function useClients(options: UseClientsOptions = {}): UseClientsReturn {
  const { initialFilters = {} } = options;
  
  // État local
  const [clients, setClients] = useState<Omit<User, 'password'>[]>([]);
  const [searchResults, setSearchResults] = useState<ClientSearchResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fonction pour nettoyer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fonction pour récupérer la liste des clients
  const fetchClients = useCallback(async (filters: ClientSearchFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser any temporairement pour résoudre les problèmes de typage avec l'API
      const response = await apiService.get('/users', {
        params: filters as Record<string, string | number | boolean>
      });
      
      if (response.success && response.data) {
        // Adapter la structure de réponse
        // Gérer différentes structures de réponse possibles
        if (typeof response.data === 'object' && response.data !== null) {
          if ('data' in response.data && Array.isArray(response.data.data)) {
            // Format de réponse paginée
            setClients(response.data.data);
            if ('pagination' in response.data && response.data.pagination && 
                typeof response.data.pagination === 'object' && 
                response.data.pagination !== null) {
              const pagination = response.data.pagination as { total: number; page: number };
              setTotalCount(pagination.total);
              setCurrentPage(pagination.page);
            }
          } else if (Array.isArray(response.data)) {
            // Format de tableau direct
            setClients(response.data);
            setTotalCount(response.data.length);
            setCurrentPage(1);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des clients';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour la recherche avancée
  const searchClients = useCallback(async (filters: ClientSearchFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<ClientSearchResponse['data']>('/search/clients', {
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

  // Fonction pour créer un client
  const createClient = useCallback(async (data: CreateClientRequest): Promise<Omit<User, 'password'>> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.post('/users', data);
      
      if (response.success && response.data) {
        // Typer correctement la réponse pour éviter les erreurs TypeScript
        const userData = response.data as Omit<User, 'password'>;
        // Ajouter le nouveau client à la liste
        setClients(prev => [userData, ...prev]);
        return userData;
      } else {
        throw new ApiError(response.error || 'Erreur lors de la création', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la création du client';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour mettre à jour un client
  const updateClient = useCallback(async (id: string, data: UpdateClientRequest): Promise<Omit<User, 'password'>> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.put(`/users/${id}`, data);
      
      if (response.success && response.data) {
        // Typer correctement la réponse pour éviter les erreurs TypeScript
        const userData = response.data as Omit<User, 'password'>;
        // Mettre à jour le client dans la liste
        setClients(prev => 
          prev.map(client => 
            client.id === id ? userData : client
          )
        );
        return userData;
      } else {
        throw new ApiError(response.error || 'Erreur lors de la mise à jour', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour du client';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour supprimer un client
  const deleteClient = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.delete(`/users/${id}`);
      
      if (response.success) {
        // Retirer le client de la liste
        setClients(prev => prev.filter(client => client.id !== id));
        setTotalCount(prev => Math.max(0, prev - 1));
      } else {
        throw new ApiError(response.error || 'Erreur lors de la suppression', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la suppression du client';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer un client spécifique
  const getClient = useCallback(async (id: string): Promise<Omit<User, 'password'>> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<Omit<User, 'password'>>(`/users/${id}`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new ApiError(response.error || 'Client non trouvé', 404);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement du client';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les clients actifs
  const getActiveClients = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<Omit<User, 'password'>[]>('/users/active');
      
      if (response.success && response.data) {
        setClients(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des clients actifs';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les statistiques d'un client
  const getClientStats = useCallback(async (id: string): Promise<ClientStats> => {
    try {
      const response = await apiService.get<ClientStats>(`/users/${id}/stats`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new ApiError(response.error || 'Statistiques non disponibles', 404);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des statistiques';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Fonction pour mettre à jour le statut d'un client
  const updateClientStatus = useCallback(async (id: string, status: UserStatus): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.patch(`/users/${id}/status`, { status });
      
      if (response.success) {
        // Mettre à jour le client dans la liste
        setClients(prev => 
          prev.map(client => 
            client.id === id ? { ...client, status } : client
          )
        );
      } else {
        throw new ApiError(response.error || 'Erreur lors de la mise à jour du statut', 400);
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour du statut';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour rafraîchir les clients
  const refreshClients = useCallback(async (): Promise<void> => {
    // Réinitialiser le state de chargement et d'erreur
    setIsLoading(true);
    setError(null);
    try {
      // Récupérer la liste à jour des clients
      await fetchClients(initialFilters);
    } catch {
      // Gérer silencieusement l'erreur car fetchClients a déjà mis à jour l'état d'erreur
      // L'erreur est déjà gérée par fetchClients
    } finally {
      setIsLoading(false);
    }
  }, [fetchClients, initialFilters]);

  return {
    // État
    clients,
    isLoading,
    error,
    
    // Recherche et pagination
    searchResults,
    totalCount,
    currentPage,
    
    // Actions CRUD
    fetchClients,
    searchClients,
    createClient,
    updateClient,
    deleteClient,
    getClient,
    
    // Actions spécifiques
    getActiveClients,
    getClientStats,
    updateClientStatus,
    
    // Utilitaires
    clearError,
    refreshClients,
  };
}
