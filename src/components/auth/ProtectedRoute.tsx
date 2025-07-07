// Composant simple pour protéger les routes
// Alternative légère au HOC withAuth

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

// Composant de chargement par défaut
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback = <LoadingSpinner /> 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/auth/login?from=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.push('/dashboard');
      return;
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
