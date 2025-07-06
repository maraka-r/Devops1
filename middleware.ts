import { NextRequest, NextResponse } from 'next/server';
import { metrics } from './src/lib/metrics';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  const response = NextResponse.next();
  
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