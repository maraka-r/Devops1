// API Route pour la gestion d'un utilisateur spécifique
// GET /api/users/[id] - Récupérer un utilisateur (admin seulement)
// PUT /api/users/[id] - Modifier un utilisateur (admin seulement)
// DELETE /api/users/[id] - Supprimer un utilisateur (admin seulement)

import { NextRequest, NextResponse } from 'next/server';
import { updateUserAdminSchema } from '@/lib/validation';
import { hashPassword, normalizeEmail } from '@/lib/auth';
import { withErrorHandler, withMethodValidation, withAdminAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import { handlePrismaError } from '@/lib/utils';
import prisma from '@/lib/db';

/**
 * Handler pour récupérer un utilisateur par ID
 */
const getUserByIdHandler = async (req: NextRequest): Promise<NextResponse> => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
      message: 'Utilisateur récupéré avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
};

/**
 * Handler pour modifier un utilisateur
 */
const updateUserHandler = async (req: NextRequest): Promise<NextResponse> => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];

  try {
    const body = await req.json();
    
    // Validation des données
    const validation = updateUserAdminSchema.safeParse(body);
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

    const { email, password, name, role, phone, company, address } = validation.data;

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (address !== undefined) updateData.address = address;

    // Gérer l'email uniquement s'il a changé
    if (email && email !== existingUser.email) {
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

    // Gérer le mot de passe uniquement s'il est fourni
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
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
      message: 'Utilisateur modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    const errorMessage = handlePrismaError(error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
};

/**
 * Handler pour supprimer un utilisateur
 */
const deleteUserHandler = async (req: NextRequest): Promise<NextResponse> => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];

  try {
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
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

    // Vérifier s'il y a des locations actives
    const activeLocations = await prisma.location.count({
      where: {
        userId: id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE']
        }
      }
    });

    if (activeLocations > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Impossible de supprimer l'utilisateur: ${activeLocations} location(s) active(s)` 
        },
        { status: 409 }
      );
    }

    // Supprimer l'utilisateur (les locations seront supprimées en cascade)
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
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
      return getUserByIdHandler(req);
    case 'PUT':
      return updateUserHandler(req);
    case 'DELETE':
      return deleteUserHandler(req);
    default:
      return NextResponse.json(
        { success: false, error: `Méthode ${req.method} non autorisée` },
        { status: 405 }
      );
  }
};

// Appliquer les middlewares avec authentification admin
const handler = compose(
  withErrorHandler,
  (handler) => withMethodValidation(['GET', 'PUT', 'DELETE'], handler),
  withAdminAuth
)(mainHandler);

export { handler as GET, handler as PUT, handler as DELETE };
