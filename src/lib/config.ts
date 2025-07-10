// Utilitaire pour la configuration de l'environnement
// Gestion des URLs et des configurations selon l'environnement

/**
 * Détermine l'URL de base de l'API selon l'environnement
 */
export function getApiBaseUrl(): string {
  // Utiliser NEXT_PUBLIC_API_URL si défini, sinon fallback sur localhost
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (apiUrl) {
    return apiUrl;
  }
  
  // En production côté client, utiliser l'origine actuelle
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return `${window.location.origin}/api`;
  }
  
  // Fallback pour le développement
  return 'http://localhost:3000/api';
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
