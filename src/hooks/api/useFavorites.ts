// Hook pour la gestion des favoris
// CRUD, recherche, statistiques

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiService, ApiError } from '@/lib/api';
import { Favori, Materiel } from '@/types';

// Types pour le hook
interface FavoriWithMateriel extends Favori {
  materiel: Materiel;
}

interface UseFavoritesOptions {
  autoFetch?: boolean;
}

interface UseFavoritesReturn {
  // État
  favorites: FavoriWithMateriel[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFavorites: () => Promise<void>;
  addFavorite: (materielId: string) => Promise<void>;
  removeFavorite: (materielId: string) => Promise<void>;
  toggleFavorite: (materielId: string) => Promise<void>;
  isFavorite: (materielId: string) => boolean;
  
  // Utilitaires
  getFavoriteStats: () => {
    total: number;
    available: number;
    averagePrice: number;
    recentlyAdded: number;
  };
}

export function useFavorites(options: UseFavoritesOptions = {}): UseFavoritesReturn {
  const { autoFetch = true } = options;
  
  const [favorites, setFavorites] = useState<FavoriWithMateriel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get<FavoriWithMateriel[]>('/api/favoris');
      
      if (response.success && response.data) {
        setFavorites(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des favoris');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erreur lors du chargement des favoris';
      setError(message);
      console.error('Erreur fetchFavorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add favorite
  const addFavorite = useCallback(async (materielId: string) => {
    try {
      setError(null);
      
      const response = await apiService.post<FavoriWithMateriel>('/api/favoris', { materielId });
      
      if (response.success && response.data) {
        setFavorites(prev => [...prev, response.data!]);
      } else {
        throw new Error(response.error || 'Erreur lors de l\'ajout aux favoris');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erreur lors de l\'ajout aux favoris';
      setError(message);
      console.error('Erreur addFavorite:', err);
      throw err;
    }
  }, []);

  // Remove favorite
  const removeFavorite = useCallback(async (materielId: string) => {
    try {
      setError(null);
      
      const response = await apiService.delete(`/api/favoris/${materielId}`);
      
      if (response.success) {
        setFavorites(prev => prev.filter(f => f.materielId !== materielId));
      } else {
        throw new Error(response.error || 'Erreur lors de la suppression du favori');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erreur lors de la suppression du favori';
      setError(message);
      console.error('Erreur removeFavorite:', err);
      throw err;
    }
  }, []);

  // Check if materiel is favorite
  const isFavorite = useCallback((materielId: string): boolean => {
    return favorites.some(f => f.materielId === materielId);
  }, [favorites]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (materielId: string) => {
    if (isFavorite(materielId)) {
      await removeFavorite(materielId);
    } else {
      await addFavorite(materielId);
    }
  }, [addFavorite, removeFavorite, isFavorite]);

  // Get favorite stats
  const getFavoriteStats = useCallback(() => {
    const total = favorites.length;
    const available = favorites.filter(f => f.materiel.status === 'AVAILABLE').length;
    const averagePrice = total > 0 
      ? favorites.reduce((sum, f) => sum + Number(f.materiel.pricePerDay), 0) / total 
      : 0;
    const recentlyAdded = favorites.filter(f => {
      const daysDiff = (Date.now() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    return {
      total,
      available,
      averagePrice,
      recentlyAdded,
    };
  }, [favorites]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchFavorites();
    }
  }, [autoFetch, fetchFavorites]);

  return {
    favorites,
    isLoading,
    error,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoriteStats,
  };
}
