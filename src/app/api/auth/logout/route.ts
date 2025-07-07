// API Route pour la déconnexion des utilisateurs
// POST /api/auth/logout - Déconnexion utilisateur

import { NextResponse } from 'next/server';
import { withErrorHandler, withMethodValidation, withAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';

/**
 * Handler principal pour la déconnexion
 * Note: Dans une implémentation JWT stateless, la déconnexion côté serveur
 * consiste principalement à invalider le token (blacklist) si nécessaire.
 * Pour une approche simple, on se contente de retourner un succès et 
 * le client supprime le token de son stockage local.
 */
const logoutHandler = async (): Promise<NextResponse> => {
  try {
    // Dans une implémentation plus avancée, on pourrait :
    // 1. Ajouter le token à une blacklist en Redis/DB
    // 2. Invalider tous les tokens de l'utilisateur
    // 3. Logger l'événement de déconnexion
    
    // Pour l'instant, on se contente de retourner un succès
    // Le client devra supprimer le token de son côté
    
    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie'
    });
    
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
};

// Appliquer les middlewares
const handler = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['POST'], handler),
  withAuth // Vérifier que l'utilisateur est authentifié
)(logoutHandler);

export { handler as POST };
