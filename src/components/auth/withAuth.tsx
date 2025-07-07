// Higher-Order Component pour la protection des pages
// Vérifie l'authentification et les permissions

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

// Types pour les options du HOC
interface WithAuthOptions {
  requireAuth?: boolean;
  requiredRole?: UserRole;
  redirectTo?: string;
  fallback?: React.ComponentType;
}

// Composant de chargement par défaut
const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

// Composant d'accès refusé par défaut
const DefaultAccessDeniedComponent = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
      <p className="text-gray-600">Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.</p>
    </div>
  </div>
);

/**
 * HOC pour protéger les pages avec authentification
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    requireAuth = true,
    requiredRole,
    redirectTo = '/auth/login',
    fallback: LoadingComponent = DefaultLoadingComponent
  } = options;

  const AuthenticatedComponent = (props: P) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Attendre que l'état d'authentification soit déterminé
      if (isLoading) return;

      // Vérifier si l'authentification est requise
      if (requireAuth && !isAuthenticated) {
        const currentPath = window.location.pathname;
        const loginUrl = `${redirectTo}?from=${encodeURIComponent(currentPath)}`;
        router.push(loginUrl);
        return;
      }

      // Vérifier le rôle requis
      if (requiredRole && user?.role !== requiredRole) {
        router.push('/dashboard'); // Rediriger vers le dashboard si pas les bonnes permissions
        return;
      }
    }, [isLoading, isAuthenticated, user, router]);

    // Afficher le composant de chargement pendant la vérification
    if (isLoading) {
      return <LoadingComponent />;
    }

    // Afficher le composant d'accès refusé si pas authentifié
    if (requireAuth && !isAuthenticated) {
      return <DefaultAccessDeniedComponent />;
    }

    // Afficher le composant d'accès refusé si pas le bon rôle
    if (requiredRole && user?.role !== requiredRole) {
      return <DefaultAccessDeniedComponent />;
    }

    // Afficher le composant protégé
    return <Component {...props} />;
  };

  // Définir le nom du composant pour le debugging
  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return AuthenticatedComponent;
}

/**
 * HOC pour les pages admin uniquement
 */
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<WithAuthOptions, 'requiredRole'> = {}
) {
  return withAuth(Component, { ...options, requiredRole: UserRole.ADMIN });
}

/**
 * HOC pour les pages qui ne nécessitent pas d'authentification
 */
export function withoutAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<WithAuthOptions, 'requireAuth'> = {}
) {
  return withAuth(Component, { ...options, requireAuth: false });
}

/**
 * Hook pour vérifier les permissions
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    return isAuthenticated && user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return isAuthenticated && user?.role ? roles.includes(user.role) : false;
  };

  const canAccessAdminFeatures = (): boolean => {
    return hasRole(UserRole.ADMIN);
  };

  const canManageUsers = (): boolean => {
    return hasRole(UserRole.ADMIN);
  };

  const canManageContent = (): boolean => {
    return hasRole(UserRole.ADMIN);
  };

  return {
    hasRole,
    hasAnyRole,
    canAccessAdminFeatures,
    canManageUsers,
    canManageContent,
    isAuthenticated,
    user,
  };
}

/**
 * Composant de protection pour les éléments conditionnels
 */
interface ProtectedElementProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export function ProtectedElement({
  children,
  requiredRole,
  requiredRoles,
  fallback = null,
}: ProtectedElementProps) {
  const { hasRole, hasAnyRole, isAuthenticated } = usePermissions();

  // Vérifier l'authentification
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Vérifier le rôle spécifique
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  // Vérifier les rôles multiples
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
