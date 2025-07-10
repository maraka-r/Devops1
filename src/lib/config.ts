// Utilitaire pour la configuration de l'environnement
// Gestion des URLs et des configurations selon l'environnement

/**
 * Détermine l'URL de base de l'API selon l'environnement
 */
export function getApiBaseUrl(): string {
  // En production, utiliser une URL relative pour éviter les problèmes CORS
  if (typeof window !== 'undefined') {
    // Côté client
    if (process.env.NODE_ENV === 'production') {
      return `${window.location.origin}/api`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  }
  
  // Côté serveur
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
}

/**
 * Vérifie si nous sommes en environnement de production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Obtient l'URL de base du site
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}
