// Middleware d'authentification pour les API routes
// Vérification des tokens JWT et des permissions

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { UserRole } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware pour vérifier l'authentification
 */
export const withAuth = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('Authorization');
      const token = extractTokenFromHeader(authHeader);
      
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Token manquant' },
          { status: 401 }
        );
      }
      
      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json(
          { success: false, error: 'Token invalide' },
          { status: 401 }
        );
      }
      
      // Ajouter les informations utilisateur à la requête
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      
      return await handler(req);
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur d\'authentification' },
        { status: 401 }
      );
    }
  };
};

/**
 * Middleware pour vérifier les permissions admin
 */
export const withAdminAuth = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
  return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }
    
    return await handler(req);
  });
};

/**
 * Middleware pour vérifier que l'utilisateur peut accéder à sa propre ressource
 */
export const withUserAuth = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
  return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Si un userId est spécifié, vérifier que c'est le bon utilisateur ou un admin
    if (userId && req.user?.userId !== userId && req.user?.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    return await handler(req);
  });
};

/**
 * Middleware pour gérer les erreurs d'API
 */
export const withErrorHandler = (handler: (req: NextRequest) => Promise<NextResponse>) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('Erreur API:', error);
      
      // Erreur avec code de statut personnalisé
      if (error instanceof Error && 'statusCode' in error) {
        const customError = error as Error & { statusCode: number };
        return NextResponse.json(
          { success: false, error: customError.message },
          { status: customError.statusCode }
        );
      }
      
      // Erreur générique
      return NextResponse.json(
        { success: false, error: 'Erreur serveur interne' },
        { status: 500 }
      );
    }
  };
};

/**
 * Middleware pour valider les méthodes HTTP
 */
export const withMethodValidation = (
  allowedMethods: string[],
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (!allowedMethods.includes(req.method)) {
      return NextResponse.json(
        { success: false, error: `Méthode ${req.method} non autorisée` },
        { status: 405 }
      );
    }
    
    return await handler(req);
  };
};

/**
 * Middleware pour valider les données JSON
 */
export const withJSONValidation = (handler: (req: NextRequest) => Promise<NextResponse>) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const contentType = req.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          return NextResponse.json(
            { success: false, error: 'Content-Type doit être application/json' },
            { status: 400 }
          );
        }
        
        // Vérifier que le body est du JSON valide
        const body = await req.json();
        
        // Recréer la requête avec le body parsé
        const newRequest = new Request(req.url, {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify(body),
        });
        
        return await handler(newRequest as NextRequest);
      } catch {
        return NextResponse.json(
          { success: false, error: 'JSON invalide' },
          { status: 400 }
        );
      }
    }
    
    return await handler(req);
  };
};

/**
 * Type pour les handlers middleware
 */
type MiddlewareHandler = (req: NextRequest) => Promise<NextResponse>;
type Middleware = (handler: MiddlewareHandler) => MiddlewareHandler;

/**
 * Composer plusieurs middlewares ensemble
 */
export const compose = (...middlewares: Middleware[]) => {
  return (handler: MiddlewareHandler): MiddlewareHandler => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
};
