// Hook pour la gestion des notifications
// Récupération, marquage comme lu, suppression

'use client';

import { useState, useCallback } from 'react';
import { apiService } from '@/lib/api';
import { 
  NotificationType,
  NotificationPriority,
  ApiResponse
} from '@/types';

// Types simplifiés pour les notifications
interface SimpleNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

// Mock data pour développement
const mockNotifications: SimpleNotification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'LOCATION_CONFIRMED',
    title: 'Location confirmée',
    message: 'Votre location de grue mobile a été confirmée pour demain.',
    priority: 'NORMAL',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'PAYMENT_DUE',
    title: 'Paiement à effectuer',
    message: 'Votre facture FAC-2024-002 arrive à échéance dans 3 jours.',
    priority: 'HIGH',
    read: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Il y a 4h
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'MATERIEL_AVAILABLE',
    title: 'Matériel disponible',
    message: 'La pelleteuse que vous suivez est maintenant disponible.',
    priority: 'NORMAL',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Il y a 1 jour
    readAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
  },
  {
    id: 'notif-4',
    userId: 'user-1',
    type: 'LOCATION_REMINDER',
    title: 'Rappel de location',
    message: 'N\'oubliez pas que votre location commence dans 24h.',
    priority: 'NORMAL',
    read: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // Il y a 2 jours
    readAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
  },
];

interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
}

interface UseNotificationsReturn {
  // État
  notifications: SimpleNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getUnreadCount: () => Promise<number>;
  
  // Utilitaires
  clearError: () => void;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  // État local
  const [notifications, setNotifications] = useState<SimpleNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour nettoyer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fonction pour récupérer les notifications
  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      interface NotificationResponse {
        notifications: SimpleNotification[];
        unreadCount: number;
      }
      
      const response = await apiService.get<ApiResponse<NotificationResponse>>('/api/notifications', {
        params: filters as Record<string, string | number | boolean>,
      });

      // Type assertion pour résoudre le problème de typage
      const data = response.data as unknown as { 
        data?: NotificationResponse;
        notifications?: SimpleNotification[];
        unreadCount?: number;
      };

      if (data?.data?.notifications) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount || 0);
      }
      else if (data?.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }

    } catch {
      console.log('API non disponible, utilisation des mocks pour les notifications');
      
      // Fallback sur les mocks avec filtrage
      let filteredMocks = mockNotifications;
      
      if (filters.read !== undefined) {
        filteredMocks = mockNotifications.filter(notif => notif.read === filters.read);
      }
      
      if (filters.type) {
        filteredMocks = filteredMocks.filter(notif => notif.type === filters.type);
      }
      
      if (filters.priority) {
        filteredMocks = filteredMocks.filter(notif => notif.priority === filters.priority);
      }

      setNotifications(filteredMocks);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    }

    setIsLoading(false);
  }, []);

  // Fonction pour marquer une notification comme lue
  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiService.put(`/api/notifications/${id}/read`);
      
      setNotifications(prev => prev.map(notif => 
        notif.id === id 
          ? { ...notif, read: true, readAt: new Date() }
          : notif
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch {
      console.log('API non disponible, simulation du marquage comme lu');
      
      setNotifications(prev => prev.map(notif => 
        notif.id === id 
          ? { ...notif, read: true, readAt: new Date() }
          : notif
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await apiService.put('/api/notifications/read-all');
      
      setNotifications(prev => prev.map(notif => ({ 
        ...notif, 
        read: true, 
        readAt: new Date() 
      })));
      
      setUnreadCount(0);

    } catch {
      console.log('API non disponible, simulation du marquage de toutes comme lues');
      
      setNotifications(prev => prev.map(notif => ({ 
        ...notif, 
        read: true, 
        readAt: new Date() 
      })));
      
      setUnreadCount(0);
    }
  }, []);

  // Fonction pour supprimer une notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await apiService.delete(`/api/notifications/${id}`);
      
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

    } catch {
      console.log('API non disponible, simulation de la suppression');
      
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  }, [notifications]);

  // Fonction pour récupérer le nombre de notifications non lues
  const getUnreadCount = useCallback(async (): Promise<number> => {
    try {
      interface CountResponse {
        count: number;
      }
      
      const response = await apiService.get<ApiResponse<CountResponse> | CountResponse>('/api/notifications/unread-count');
      
      // Type assertion pour résoudre le problème de typage
      const data = response.data as unknown as { 
        data?: { count: number };
        count?: number;
      };
      
      const count = data?.data?.count || data?.count || 0;
      setUnreadCount(count);
      return count;
    } catch {
      const count = mockNotifications.filter(n => !n.read).length;
      setUnreadCount(count);
      return count;
    }
  }, []);

  // Fonction pour rafraîchir les notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  return {
    // État
    notifications,
    unreadCount,
    isLoading,
    error,
    
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    
    // Utilitaires
    clearError,
    refreshNotifications,
  };
}
