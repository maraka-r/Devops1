// Hook pour la gestion du dashboard
// Statistiques, données récentes, alertes

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiService, ApiError } from '@/lib/api';
import { DashboardStats, DashboardAlerts, DashboardRecentActivity } from '@/types';

// Types pour les options du hook
interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDashboardReturn {
  // État
  stats: DashboardStats | null;
  alerts: DashboardAlerts | null;
  recentActivity: DashboardRecentActivity | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchRecentActivity: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
}

export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  // État local
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
  const [recentActivity, setRecentActivity] = useState<DashboardRecentActivity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour nettoyer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fonction pour récupérer les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiService.get<DashboardStats>('/dashboard/stats');
      
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      // Si l'API n'est pas disponible (404), utiliser les données de mock
      if (err instanceof ApiError && err.status === 404) {
        console.warn('API dashboard/stats non disponible, utilisation des données de mock');
        const { mockDashboardStats } = await import('@/lib/mockDashboardData');
        setStats(mockDashboardStats);
      } else {
        const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des statistiques';
        setError(errorMessage);
      }
    }
  }, []);

  // Fonction pour récupérer les alertes
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await apiService.get<DashboardAlerts>('/dashboard/alerts');
      
      if (response.success && response.data) {
        setAlerts(response.data);
      }
    } catch (err) {
      // Si l'API n'est pas disponible (404), utiliser les données de mock
      if (err instanceof ApiError && err.status === 404) {
        console.warn('API dashboard/alerts non disponible, utilisation des données de mock');
        const { mockDashboardAlerts } = await import('@/lib/mockDashboardData');
        setAlerts(mockDashboardAlerts);
      } else {
        const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des alertes';
        setError(errorMessage);
      }
    }
  }, []);

  // Fonction pour récupérer l'activité récente
  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await apiService.get<DashboardRecentActivity>('/dashboard/recent-activity');
      
      if (response.success && response.data) {
        setRecentActivity(response.data);
      }
    } catch (err) {
      // Si l'API n'est pas disponible (404), utiliser les données de mock
      if (err instanceof ApiError && err.status === 404) {
        console.warn('API dashboard/recent-activity non disponible, utilisation des données de mock');
        const { mockDashboardRecentActivity } = await import('@/lib/mockDashboardData');
        setRecentActivity(mockDashboardRecentActivity);
      } else {
        const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement de l\'activité récente';
        setError(errorMessage);
      }
    }
  }, []);

  // Fonction pour récupérer toutes les données du dashboard
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Récupérer toutes les données en parallèle
      await Promise.all([
        fetchStats(),
        fetchAlerts(),
        fetchRecentActivity()
      ]);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement du dashboard';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats, fetchAlerts, fetchRecentActivity]);

  // Fonction pour rafraîchir toutes les données
  const refreshAll = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh si activé
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshAll();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshAll]);

  // Chargement initial
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    // État
    stats,
    alerts,
    recentActivity,
    isLoading,
    error,
    
    // Actions
    fetchDashboardData,
    fetchStats,
    fetchAlerts,
    fetchRecentActivity,
    refreshAll,
    
    // Utilitaires
    clearError,
  };
}
