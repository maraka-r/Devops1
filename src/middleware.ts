// Middleware pour la protection des routes
// Gestion de l'authentification et des permissions

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/api/metrics',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

// Routes API qui nécessitent une authentification
const protectedApiRoutes = [
  '/api/materiels',
  '/api/locations',
  '/api/clients',
  '/api/search',
  '/api/dashboard',
  '/api/invoices',
  '/api/payments',
  '/api/settings',
  '/api/users'
];

// Routes admin qui nécessitent des permissions spéciales
const adminRoutes = [
  '/admin',
  '/api/admin',
  '/api/users',
  '/api/settings/company'
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );
}

function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some(route => 
    pathname.startsWith(route)
  );
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => 
    pathname.startsWith(route)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Ignorer les routes publiques
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Récupérer le token d'authentification
  const token = request.cookies.get('token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Vérifier si un token est présent
  if (!token) {
    // Rediriger vers la page de connexion pour les pages web
    if (!pathname.startsWith('/api/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    
    // Retourner une erreur 401 pour les API
    return NextResponse.json(
      { success: false, error: 'Token d\'authentification requis' },
      { status: 401 }
    );
  }
  
  // Vérifier la validité du token
  try {
    const payload = verifyToken(token);
    
    // Vérifier les permissions pour les routes admin
    if (isAdminRoute(pathname)) {
      if (payload.role !== 'ADMIN') {
        // Rediriger vers le dashboard pour les pages web
        if (!pathname.startsWith('/api/')) {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
        
        // Retourner une erreur 403 pour les API
        return NextResponse.json(
          { success: false, error: 'Permissions insuffisantes' },
          { status: 403 }
        );
      }
    }
    
    // Ajouter les informations utilisateur aux headers pour les API
    if (isProtectedApiRoute(pathname)) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('X-User-ID', payload.id);
      requestHeaders.set('X-User-Email', payload.email);
      requestHeaders.set('X-User-Role', payload.role);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    return NextResponse.next();
    
  } catch (error) {
    // Token invalide ou expiré
    console.error('Erreur de vérification du token:', error);
    
    // Rediriger vers la page de connexion pour les pages web
    if (!pathname.startsWith('/api/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('from', pathname);
      url.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(url);
    }
    
    // Retourner une erreur 401 pour les API
    return NextResponse.json(
      { success: false, error: 'Token invalide ou expiré' },
      { status: 401 }
    );
  }
}

// Configuration du matcher pour appliquer le middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
