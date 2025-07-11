import { NextRequest, NextResponse } from 'next/server';
import { metrics } from './src/lib/metrics';
import { verifyToken, JwtPayload } from './src/lib/jwt';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const pathname = request.nextUrl.pathname;
  
  // Gérer les requêtes OPTIONS pour CORS
  if (request.method === 'OPTIONS') {
    const corsResponse = new NextResponse(null, { status: 200 });
    corsResponse.headers.set('Access-Control-Allow-Origin', '*');
    corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    corsResponse.headers.set('Access-Control-Max-Age', '86400'); // 24 heures
    
    return corsResponse;
  }

  // Protection des routes pages basée sur les rôles
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/client')) {
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      console.warn(`🔒 Tentative d'accès non autorisée à ${pathname} - Token manquant`);
      // Redirection vers la page de login si pas de token
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
      const user: JwtPayload = verifyToken(token);
      
      // Protection /dashboard - seuls les ADMIN peuvent accéder
      if (pathname.startsWith('/dashboard')) {
        if (user.role !== 'ADMIN') {
          console.warn(`🔒 ADMIN requis pour ${pathname} - Utilisateur ${user.email} (${user.role}) redirigé vers son espace`);
          // Si l'utilisateur est un client (USER), rediriger vers son espace client
          if (user.role === 'USER') {
            return NextResponse.redirect(new URL('/client', request.url));
          }
          // Pour les autres rôles non reconnus, rediriger vers login
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }
      }
      
      // Protection /client - seuls les USER (clients) peuvent accéder
      if (pathname.startsWith('/client')) {
        if (user.role !== 'USER') {
          console.warn(`🔒 USER requis pour ${pathname} - Utilisateur ${user.email} (${user.role}) redirigé vers son espace`);
          // Si l'utilisateur est un admin, rediriger vers le dashboard
          if (user.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
          // Pour les autres rôles non reconnus, rediriger vers login
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur de vérification du token:', error);
      // Token invalide ou expiré, rediriger vers login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Protection des routes API sensibles
  if (pathname.startsWith('/api/')) {
    // Routes API publiques (pas de protection nécessaire)
    const publicApiRoutes = [
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/materiels', // Catalogue public
      '/api/materiels/categories', // Catégories publiques
    ];

    // Routes API qui nécessitent une authentification ADMIN
    const adminApiRoutes = [
      '/api/dashboard/admin',
      '/api/users',
      '/api/reports',
      '/api/settings/company',
    ];

    const isPublicRoute = publicApiRoutes.some(route => pathname.startsWith(route));
    const isAdminRoute = adminApiRoutes.some(route => pathname.startsWith(route));

    // Si c'est une route admin, vérifier le rôle
    if (isAdminRoute && !isPublicRoute) {
      const token = request.cookies.get('token')?.value || 
                    request.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        return NextResponse.json(
          { error: 'Token d\'authentification requis' },
          { status: 401 }
        );
      }

      try {
        const user: JwtPayload = verifyToken(token);
        if (user.role !== 'ADMIN') {
          console.warn(`🔒 Tentative d'accès API non autorisée à ${pathname} par ${user.email} (rôle: ${user.role})`);
          return NextResponse.json(
            { error: 'Accès interdit - Droits administrateur requis' },
            { status: 403 }
          );
        }
      } catch (tokenError) {
        console.error('❌ Erreur de vérification du token API:', tokenError);
        return NextResponse.json(
          { error: 'Token invalide ou expiré' },
          { status: 401 }
        );
      }
    }
  }
  
  // Pour toutes les autres requêtes (y compris les API routes)
  const response = NextResponse.next();
  
  // Ajouter les en-têtes CORS pour les API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Capturer les métriques pour les API routes
    const duration = (Date.now() - start) / 1000;
    const method = request.method;
    const route = pathname;
    const status = response.status.toString();

    metrics.httpRequestsTotal.inc({ method, route, status });
    metrics.httpRequestDuration.observe({ method, route }, duration);
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