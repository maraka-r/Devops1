import { NextRequest, NextResponse } from 'next/server';
import { metrics } from './src/lib/metrics';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  // Gérer les requêtes OPTIONS pour CORS
  if (request.method === 'OPTIONS') {
    const corsResponse = new NextResponse(null, { status: 200 });
    corsResponse.headers.set('Access-Control-Allow-Origin', '*');
    corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    corsResponse.headers.set('Access-Control-Max-Age', '86400'); // 24 heures
    
    return corsResponse;
  }
  
  // Pour toutes les autres requêtes
  const response = NextResponse.next();
  
  // Ajouter les en-têtes CORS
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Capturer les métriques après la réponse
  const duration = (Date.now() - start) / 1000;
  const method = request.method;
  const route = request.nextUrl.pathname;
  const status = response.status.toString();

  metrics.httpRequestsTotal.inc({ method, route, status });
  metrics.httpRequestDuration.observe({ method, route }, duration);

  return response;
}

export const config = {
  matcher: '/api/:path*',
};