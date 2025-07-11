import { NextRequest, NextResponse } from 'next/server';
import { metrics } from './src/lib/metrics';
import { verifyToken, JwtPayload } from './src/lib/jwt';

// Configuration des routes
const ROUTES_CONFIG = {
  PUBLIC_API: [
    '/api/health',
    '/api/auth/login',
    '/api/auth/register',
    '/api/materiels',
    '/api/materiels/categories',
  ],
  ADMIN_API: [
    '/api/dashboard/admin',
    '/api/users',
    '/api/reports',
    '/api/settings/company',
  ],
  PUBLIC_PAGES: [
    '/',
    '/auth/login',
    '/auth/register',
    '/logout',
  ],
} as const;

// Types pour une meilleure lisibilité
type UserRole = 'ADMIN' | 'USER';
type RouteProtection = {
  requiresAuth: boolean;
  allowedRoles?: UserRole[];
  redirectPath?: string;
};

/**
 * Détermine la protection nécessaire pour une route donnée
 */
function getRouteProtection(pathname: string): RouteProtection {
  // Pages publiques - pas de protection
  if (ROUTES_CONFIG.PUBLIC_PAGES.some(route => pathname === route)) {
    return { requiresAuth: false };
  }

  // Routes dashboard - ADMIN uniquement
  if (pathname.startsWith('/dashboard')) {
    return { 
      requiresAuth: true, 
      allowedRoles: ['ADMIN'],
      redirectPath: '/client' // Rediriger les USER vers leur espace
    };
  }

  // Routes client - USER uniquement
  if (pathname.startsWith('/client')) {
    return { 
      requiresAuth: true, 
      allowedRoles: ['USER'],
      redirectPath: '/dashboard' // Rediriger les ADMIN vers leur espace
    };
  }

  // Routes API publiques
  if (ROUTES_CONFIG.PUBLIC_API.some(route => pathname.startsWith(route))) {
    return { requiresAuth: false };
  }

  // Routes API admin
  if (ROUTES_CONFIG.ADMIN_API.some(route => pathname.startsWith(route))) {
    return { requiresAuth: true, allowedRoles: ['ADMIN'] };
  }

  // Par défaut, pas de protection (autres routes)
  return { requiresAuth: false };
}

/**
 * Crée une réponse CORS pour les requêtes OPTIONS
 */
function createCorsResponse(): NextResponse {
  const corsResponse = new NextResponse(null, { status: 200 });
  corsResponse.headers.set('Access-Control-Allow-Origin', '*');
  corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  corsResponse.headers.set('Access-Control-Max-Age', '86400'); // 24 heures
  return corsResponse;
}

/**
 * Extrait le token d'authentification de la requête
 */
function extractToken(request: NextRequest): string | null {
  return request.cookies.get('token')?.value || 
         request.headers.get('authorization')?.replace('Bearer ', '') || 
         null;
}

/**
 * Vérifie si l'utilisateur a les droits pour accéder à une route
 */
function hasAccess(userRole: UserRole, allowedRoles?: UserRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
}

/**
 * Gère la redirection selon le rôle de l'utilisateur
 */
function handleRoleRedirect(userRole: UserRole, pathname: string, requestUrl: string): NextResponse {
  const redirectPath = userRole === 'ADMIN' ? '/dashboard' : '/client';
  console.warn(`🔒 Redirection automatique: ${userRole} de ${pathname} vers ${redirectPath}`);
  return NextResponse.redirect(new URL(redirectPath, requestUrl));
}

/**
 * Ajoute les en-têtes CORS à une réponse
 */
function addCorsHeaders(response: NextResponse): void {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

/**
 * Capture les métriques pour les requêtes API
 */
function captureMetrics(request: NextRequest, response: NextResponse, startTime: number): void {
  const duration = (Date.now() - startTime) / 1000;
  const method = request.method;
  const route = request.nextUrl.pathname;
  const status = response.status.toString();

  metrics.httpRequestsTotal.inc({ method, route, status });
  metrics.httpRequestDuration.observe({ method, route }, duration);
}

/**
 * Gère les erreurs d'authentification pour les API
 */
function handleApiAuthError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}

export function middleware(request: NextRequest) {
  const start = Date.now();
  const pathname = request.nextUrl.pathname;
  
  // Gérer les requêtes OPTIONS pour CORS
  if (request.method === 'OPTIONS') {
    return createCorsResponse();
  }

  // Déterminer la protection nécessaire pour cette route
  const routeProtection = getRouteProtection(pathname);
  
  // Si la route ne nécessite pas d'authentification
  if (!routeProtection.requiresAuth) {
    const response = NextResponse.next();
    
    // Ajouter les en-têtes CORS pour les routes API
    if (pathname.startsWith('/api/')) {
      addCorsHeaders(response);
      captureMetrics(request, response, start);
    }
    
    return response;
  }

  // Route protégée : vérifier l'authentification
  const token = extractToken(request);
  
  if (!token) {
    console.warn(`🔒 Token manquant pour ${pathname}`);
    
    // Pour les API, retourner une erreur JSON
    if (pathname.startsWith('/api/')) {
      return handleApiAuthError('Token d\'authentification requis', 401);
    }
    
    // Pour les pages, rediriger vers la page de connexion
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Vérifier et décoder le token
  let user: JwtPayload;
  try {
    user = verifyToken(token);
  } catch (error) {
    console.error('🔒 Token invalide:', error);
    
    // Pour les API, retourner une erreur JSON
    if (pathname.startsWith('/api/')) {
      return handleApiAuthError('Token invalide ou expiré', 401);
    }
    
    // Pour les pages, supprimer le token invalide et rediriger
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  // Vérifier les permissions selon le rôle
  if (!hasAccess(user.role as UserRole, routeProtection.allowedRoles)) {
    console.warn(`🔒 Accès refusé: ${user.role} tentative d'accès à ${pathname}`);
    
    // Pour les API, retourner une erreur JSON
    if (pathname.startsWith('/api/')) {
      return handleApiAuthError('Accès interdit - Droits insuffisants', 403);
    }
    
    // Pour les pages, rediriger vers l'espace approprié
    const redirectPath = routeProtection.redirectPath || '/';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Redirection automatique selon le rôle pour certaines pages
  if (pathname === '/dashboard' && user.role === 'USER') {
    return handleRoleRedirect(user.role as UserRole, pathname, request.url);
  }
  
  if (pathname === '/client' && user.role === 'ADMIN') {
    return handleRoleRedirect(user.role as UserRole, pathname, request.url);
  }

  // Autoriser l'accès
  const response = NextResponse.next();
  
  // Ajouter les en-têtes CORS pour les routes API
  if (pathname.startsWith('/api/')) {
    addCorsHeaders(response);
    captureMetrics(request, response, start);
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',          // Toutes les routes API (pour CORS + protection)
    '/dashboard/:path*',    // Routes dashboard (protection ADMIN)
    '/client/:path*',       // Routes client (protection USER)
  ],
};