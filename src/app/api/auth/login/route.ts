// API Route pour l'authentification des utilisateurs
// POST /api/auth/login - Connexion utilisateur

import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { generateToken, verifyPassword, normalizeEmail } from '@/lib/auth';
import { withErrorHandler, withMethodValidation } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import prisma from '@/lib/db';

/**
 * Handler principal pour la connexion
 */
const loginHandler = async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json();
  
  // Validation des données d'entrée
  const validation = loginSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Données invalides',
        details: validation.error.format()
      },
      { status: 400 }
    );
  }
  
  const { email, password } = validation.data;
  const normalizedEmail = normalizeEmail(email);
  
  try {
    // Rechercher l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }
    
    // Vérifier le mot de passe
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }
    
    // Générer un token JWT
    const { token } = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    // Retourner l'utilisateur (sans le mot de passe) et le token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: 'Connexion réussie'
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
};

// Appliquer les middlewares
const handler = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['POST'], handler)
)(loginHandler);

export { handler as POST, handler as OPTIONS };
