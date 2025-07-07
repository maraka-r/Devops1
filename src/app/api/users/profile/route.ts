// API Route pour la gestion du profil utilisateur connecté
// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
// PUT /api/users/profile - Modifier le profil de l'utilisateur connecté

import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfileSchema } from '@/lib/validation';
import { hashPassword, normalizeEmail } from '@/lib/auth';
import { withErrorHandler, withMethodValidation, withAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import { handlePrismaError } from '@/lib/utils';
import prisma from '@/lib/db';

/**
 * Handler pour récupérer le profil de l'utilisateur connecté
 */
const getUserProfileHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // L'ID utilisateur est injecté par le middleware withAuth
    const userId = (req as NextRequest & { user: { userId: string } }).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        company: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            locations: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Profil récupéré avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
};

/**
 * Handler pour modifier le profil de l'utilisateur connecté
 */
const updateUserProfileHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // L'ID utilisateur est injecté par le middleware withAuth
    const userId = (req as NextRequest & { user: { userId: string } }).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validation des données
    const validation = updateUserProfileSchema.safeParse(body);
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

    const { email, password, currentPassword, name, phone, company, address } = validation.data;

    // Récupérer l'utilisateur actuel
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true
      }
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (address !== undefined) updateData.address = address;

    // Gérer l'email uniquement s'il a changé
    if (email && email !== currentUser.email) {
      const normalizedEmail = normalizeEmail(email);
      
      // Vérifier que le nouvel email n'est pas déjà utilisé
      const emailExists = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Cet email est déjà utilisé' },
          { status: 409 }
        );
      }

      updateData.email = normalizedEmail;
    }

    // Gérer le changement de mot de passe
    if (password) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Le mot de passe actuel est requis pour le modifier' },
          { status: 400 }
        );
      }

      // Vérifier le mot de passe actuel
      const bcrypt = await import('bcryptjs');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'Mot de passe actuel incorrect' },
          { status: 401 }
        );
      }

      updateData.password = await hashPassword(password);
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        company: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            locations: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profil modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la modification du profil:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
};

/**
 * Router principal
 */
const mainHandler = async (req: NextRequest): Promise<NextResponse> => {
  switch (req.method) {
    case 'GET':
      return getUserProfileHandler(req);
    case 'PUT':
      return updateUserProfileHandler(req);
    default:
      return NextResponse.json(
        { success: false, error: `Méthode ${req.method} non autorisée` },
        { status: 405 }
      );
  }
};

// Appliquer les middlewares avec authentification utilisateur
const handler = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['GET', 'PUT'], handler),
  withAuth
)(mainHandler);

export { handler as GET, handler as PUT };
