// Contexte d'authentification pour l'application Maraka
// Gestion de l'état utilisateur, login/logout, permissions

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, ApiError } from '@/lib/api';
import { User, UserRole, LoginRequest, RegisterRequest, AuthResponse } from '@/types';

// Types pour le contexte d'authentification
type AuthUser = Omit<User, 'password'>;

interface AuthContextType {
  // État
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  redirectToUserSpace: () => void;
  
  // Utilitaires
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  canAccess: (resource: string) => boolean;
}

// Permissions par rôle
const ROLE_PERMISSIONS = {
  ADMIN: [
    'users.read',
    'users.create', 
    'users.update',
    'users.delete',
    'clients.read',
    'clients.search',
    'materiels.read',
    'materiels.create',
    'materiels.update', 
    'materiels.delete',
    'locations.read',
    'locations.create',
    'locations.update',
    'locations.delete',
    'reports.read',
    'settings.company',
    'billing.read',
    'support.manage'
  ],
  USER: [
    'materiels.read',
    'locations.read',
    'locations.create',
    'locations.update',
    'profile.update',
    'favorites.manage',
    'billing.own',
    'support.create'
  ]
} as const;

// Création du contexte
const AuthContext = createContext<AuthContextType | null>(null);

// Propriétés du provider
interface AuthProviderProps {
  children: ReactNode;
}

// Hook pour utiliser le contexte
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

// Provider du contexte d'authentification
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // État calculé
  const isAuthenticated = Boolean(user && apiService.isAuthenticated());

  // Fonction pour récupérer les informations utilisateur
  const refreshUser = async (): Promise<void> => {
    try {
      if (!apiService.isAuthenticated()) {
        setUser(null);
        return;
      }

      const response = await apiService.get<AuthUser>('/auth/me');
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token invalide ou expiré
        setUser(null);
        apiService.removeAuthToken();
      }
    } catch (error) {
      // Si l'erreur est un 404 ou 401, c'est normal (pas d'utilisateur connecté ou token invalide)
      if (error instanceof ApiError && (error.status === 404 || error.status === 401)) {
        // Ne pas logger cette erreur car c'est un comportement normal
        setUser(null);
        apiService.removeAuthToken();
      } else if (error instanceof Error && (
        error.message.includes('404') || 
        error.message.includes('401') ||
        error.message.includes('La ressource demandée n\'est pas disponible')
      )) {
        // Fallback pour les autres types d'erreurs 404/401
        setUser(null);
        apiService.removeAuthToken();
      } else {
        // Autres erreurs à logger
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        setUser(null);
        apiService.removeAuthToken();
      }
    }
  };

  // Fonction de connexion
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        // Sauvegarder le token
        apiService.setAuthToken(token);
        
        // Mettre à jour l'utilisateur
        setUser(userData);
        
        // Rediriger vers l'espace approprié selon le rôle
        if (userData.role === 'ADMIN') {
          router.push('/dashboard');
        } else if (userData.role === 'USER') {
          router.push('/client');
        } else {
          // Rôle non reconnu, rester sur la page de login
          console.warn('Rôle utilisateur non reconnu:', userData.role);
        }
      } else {
        throw new ApiError(response.error || 'Erreur de connexion', 400);
      }
    } catch (error) {
      // Nettoyer en cas d'erreur
      apiService.removeAuthToken();
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (data: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await apiService.post<AuthResponse>('/auth/register', data);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        // Sauvegarder le token
        apiService.setAuthToken(token);
        
        // Mettre à jour l'utilisateur
        setUser(userData);
        
        // Rediriger vers l'espace approprié selon le rôle
        if (userData.role === 'ADMIN') {
          router.push('/dashboard');
        } else if (userData.role === 'USER') {
          router.push('/client');
        } else {
          // Par défaut, rediriger vers client pour les nouveaux utilisateurs
          router.push('/');
        }
      } else {
        throw new ApiError(response.error || 'Erreur d\'inscription', 400);
      }
    } catch (error) {
      // Nettoyer en cas d'erreur
      apiService.removeAuthToken();
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async (): Promise<void> => {
    try {
      // Appeler l'API de logout si nécessaire
      await apiService.post('/auth/logout');
    } catch (error) {
      // Ignorer les erreurs de logout côté serveur
      console.warn('Erreur lors du logout côté serveur:', error);
    } finally {
      // Nettoyer côté client
      apiService.removeAuthToken();
      setUser(null);
      
      // Rediriger vers la page de login
      router.push('/auth/login');
    }
  };

  // Fonction pour rediriger vers l'espace utilisateur approprié
  const redirectToUserSpace = (): void => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    switch (user.role) {
      case 'ADMIN':
        router.push('/dashboard');
        break;
      case 'USER':
        router.push('/client');
        break;
      default:
        // Rôle non reconnu, rediriger vers login
        router.push('/auth/login');
        break;
    }
  };

  // Fonction pour vérifier les rôles
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  // Fonction pour vérifier si admin
  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  // Fonction pour vérifier les permissions
  const canAccess = (resource: string): boolean => {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(resource as never);
  };

  // Effet pour initialiser l'authentification au chargement
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Effet pour écouter les changements de token (utile pour les onglets multiples)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        if (e.newValue) {
          // Token ajouté/modifié
          refreshUser();
        } else {
          // Token supprimé
          setUser(null);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // Valeur du contexte
  const contextValue: AuthContextType = {
    // État
    user,
    isLoading,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    refreshUser,
    redirectToUserSpace,
    
    // Utilitaires
    hasRole,
    isAdmin,
    canAccess,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
