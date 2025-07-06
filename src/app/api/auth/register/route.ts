// API Route pour l'inscription des utilisateurs
// POST /api/auth/register - Création d'un nouveau compte utilisateur

import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation';
import { generateToken, hashPassword, normalizeEmail } from '@/lib/auth';
import { withErrorHandler, withMethodValidation } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import prisma from '@/lib/db';

/**
 * Handler principal pour l'inscription
 */
const registerHandler = async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json();
  
  // Validation des données d'entrée
  const validation = registerSchema.safeParse(body);
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
  
  const { email, password, name, phone, company } = validation.data;
  const normalizedEmail = normalizeEmail(email);
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      );
    }
    
    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);
    
    // Créer le nouvel utilisateur
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        phone,
        company,
        role: 'USER', // Rôle par défaut
      }
    });
    
    // Générer un token JWT
    const { token } = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
    
    // Retourner l'utilisateur (sans le mot de passe) et le token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: 'Compte créé avec succès'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
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
)(registerHandler);

export { handler as POST };
