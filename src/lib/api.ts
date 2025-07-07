// Service API de base pour l'application Maraka
// Gestion des appels HTTP, authentification, erreurs

import { ApiResponse } from '@/types';

// Configuration de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Types pour les options de requête
interface RequestOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean>;
}

// Types pour les erreurs API
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Classe principale du service API
class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Méthode privée pour construire l'URL avec les paramètres
  private buildURL(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  // Méthode privée pour préparer les headers
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Ajouter le token d'authentification si fourni
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Récupérer le token depuis localStorage si disponible
    if (typeof window !== 'undefined' && !token) {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        headers.Authorization = `Bearer ${storedToken}`;
      }
    }

    return headers;
  }

  // Méthode privée pour traiter la réponse
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    // Vérifier si la réponse est en JSON
    if (contentType && contentType.includes('application/json')) {
      const data: ApiResponse<T> = await response.json();
      
      // Si la réponse n'est pas OK, lancer une erreur
      if (!response.ok) {
        throw new ApiError(
          data.error || `HTTP Error ${response.status}`,
          response.status,
          data.error
        );
      }
      
      return data;
    } else {
      // Réponse non-JSON
      const text = await response.text();
      
      if (!response.ok) {
        throw new ApiError(
          `HTTP Error ${response.status}: ${text}`,
          response.status
        );
      }
      
      // Retourner une réponse formatée pour les réponses non-JSON
      return {
        success: true,
        data: text as unknown as T,
        message: 'Success'
      };
    }
  }

  // Méthode générique pour les requêtes
  private async request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { token, params, ...fetchOptions } = options;
    
    try {
      const url = this.buildURL(endpoint, params);
      const headers = this.getHeaders(token);
      
      const response = await fetch(url, {
        headers,
        ...fetchOptions,
      });
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      // Si c'est déjà une ApiError, la relancer
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Sinon, créer une nouvelle ApiError
      throw new ApiError(
        error instanceof Error ? error.message : 'Une erreur est survenue',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  // Méthodes HTTP publiques
  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Méthodes utilitaires pour l'authentification
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      // Stocker dans localStorage pour l'accès côté client
      localStorage.setItem('auth_token', token);
      
      // Stocker dans un cookie pour l'accès côté serveur (middleware)
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
    }
  }

  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Supprimer le cookie en définissant une date d'expiration passée
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  // Méthode pour vérifier si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    return Boolean(this.getAuthToken());
  }
}

// Instance singleton du service API
export const apiService = new ApiService();

// Export de la classe pour les tests ou instances multiples
export { ApiService };

// Export des types
export type { RequestOptions };
