// API Route pour le renouvellement des tokens JWT
// POST /api/auth/refresh-token - Renouvellement du token d'authentification

import { NextRequest, NextResponse } from 'next/server';
import { refreshTokenSchema } from '@/lib/validation';
import { generateToken, verifyToken } from '@/lib/auth';
import { withErrorHandler, withMethodValidation } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import prisma from '@/lib/db';

/**
 * Handler principal pour le renouvellement de token
 */
const refreshTokenHandler = async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json();
  
  // Validation des données d'entrée
  const validation = refreshTokenSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Token invalide',
        details: validation.error.format()
      },
      { status: 400 }
    );
  }
  
  const { token: refreshToken } = validation.data;
  
  try {
    // Vérifier et décoder le token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token invalide ou expiré' },
        { status: 401 }
      );
    }
    
    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        company: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable' },
        { status: 401 }
      );
    }
    
    // Générer un nouveau token JWT
    const { token: newToken } = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        user,
        token: newToken
      },
      message: 'Token renouvelé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors du renouvellement du token:', error);
    return NextResponse.json(
      { success: false, error: 'Token invalide ou expiré' },
      { status: 401 }
    );
  }
};

// Appliquer les middlewares
const handler = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['POST'], handler)
)(refreshTokenHandler);

export { handler as POST };
