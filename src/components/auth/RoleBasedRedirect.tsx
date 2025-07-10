'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Composant pour la redirection automatique selon le rôle
 * Redirige les utilisateurs connectés vers la bonne section
 */
export default function RoleBasedRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Attendre que l'état d'authentification soit chargé
    if (isLoading) return;

    // Si l'utilisateur est connecté, rediriger selon son rôle
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/dashboard');
      } else if (user.role === 'USER') {
        router.push('/client');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Retourner null car ce composant ne rend rien visuellement
  return null;
}
