// Service API de base pour l'application Maraka
// Gestion des appels HTTP, authentification, erreurs

import { ApiResponse } from '@/types';
import { getApiBaseUrl } from './config';

// Configuration de base de l'API
const API_BASE_URL = getApiBaseUrl();

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
    // Vérifier si la réponse est OK
    if (!response.ok) {
      // Traitement spécial pour les erreurs 404
      if (response.status === 404) {
        // Pour les 404, on utilise un message plus clair sans afficher le HTML
        throw new ApiError(
          "La ressource demandée n'est pas disponible",
          404,
          "NOT_FOUND"
        );
      }
      
      // Pour les autres erreurs, essayer d'abord de parser comme JSON
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new ApiError(
            errorData.error || errorData.message || `HTTP Error ${response.status}`,
            response.status,
            errorData.code || `HTTP_${response.status}`
          );
        } else {
          // Si ce n'est pas du JSON, créer une erreur générique basée sur le code HTTP
          // sans inclure le contenu HTML ou texte qui pourrait être trop verbeux
          throw new ApiError(
            `Erreur ${response.status}: ${response.statusText || 'Erreur serveur'}`,
            response.status,
            `HTTP_${response.status}`
          );
        }
      } catch (err) {
        // Si l'erreur est déjà un ApiError, la propager
        if (err instanceof ApiError) {
          throw err;
        }
        
        // Sinon créer une nouvelle erreur générique
        throw new ApiError(
          `HTTP Error ${response.status}`,
          response.status,
          `HTTP_${response.status}`
        );
      }
    }

    // Traiter les réponses réussies
    const contentType = response.headers.get('content-type');
    
    // Vérifier si la réponse est en JSON
    if (contentType && contentType.includes('application/json')) {
      const data: ApiResponse<T> = await response.json();
      return data;
    } else {
      // Pour les réponses non-JSON mais OK (204 No Content, etc.)
      const text = await response.text();
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
