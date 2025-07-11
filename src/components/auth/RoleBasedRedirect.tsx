'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RoleBasedRedirectProps {
  /**
   * Si true, redirige automatiquement les utilisateurs connectés
   * Si false, ne fait rien (pour les pages publiques)
   */
  enableRedirect?: boolean;
}

/**
 * Composant pour la redirection automatique selon le rôle
 * Redirige les utilisateurs connectés vers la bonne section uniquement si enableRedirect est true
 */
export default function RoleBasedRedirect({ enableRedirect = false }: RoleBasedRedirectProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Attendre que l'état d'authentification soit chargé
    if (isLoading) return;

    // Ne rediriger que si enableRedirect est true ou si on est sur une page d'auth
    const shouldRedirect = enableRedirect || pathname.startsWith('/auth');

    // Si l'utilisateur est connecté et qu'on doit rediriger, rediriger selon son rôle
    if (isAuthenticated && user && shouldRedirect) {
      if (user.role === 'ADMIN') {
        router.push('/dashboard');
      } else if (user.role === 'USER') {
        router.push('/client');
      }
    }
  }, [isAuthenticated, user, isLoading, router, pathname, enableRedirect]);

  // Retourner null car ce composant ne rend rien visuellement
  return null;
}
