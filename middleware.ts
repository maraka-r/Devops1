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

  // Protection des routes basée sur les rôles
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/client')) {
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      // Redirection vers la page de login si pas de token
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    try {
      const user: JwtPayload = verifyToken(token);
      
      // Protection /dashboard - seuls les ADMIN peuvent accéder
      if (pathname.startsWith('/dashboard')) {
        if (user.role !== 'ADMIN') {
          // Si l'utilisateur est un client (USER), rediriger vers /client
          if (user.role === 'USER') {
            return NextResponse.redirect(new URL('/client', request.url));
          }
          // Pour les autres rôles, rediriger vers login
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }
      }
      
      // Protection /client - seuls les USER (clients) peuvent accéder
      if (pathname.startsWith('/client')) {
        if (user.role !== 'USER') {
          // Si l'utilisateur est un admin, rediriger vers /dashboard
          if (user.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
          // Pour les autres rôles, rediriger vers login
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }
      }
      
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      // Token invalide ou expiré, rediriger vers login
      return NextResponse.redirect(new URL('/auth/login', request.url));
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
    '/api/:path*',      // Toutes les routes API (pour CORS)
    '/dashboard/:path*', // Routes dashboard (protection ADMIN)
    '/client/:path*',   // Routes client (protection USER)
  ],
};