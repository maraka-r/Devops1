// API Route pour la gestion des utilisateurs
// GET /api/users - Lister les utilisateurs (admin seulement)
// POST /api/users - Créer un utilisateur (admin seulement)

import { NextRequest, NextResponse } from 'next/server';
import { createUserSchema, paginationSchema } from '@/lib/validation';
import { hashPassword, normalizeEmail } from '@/lib/auth';
import { withErrorHandler, withMethodValidation, withAdminAuth } from '@/lib/middleware';
import { compose } from '@/lib/middleware';
import { handlePrismaError } from '@/lib/utils';
import prisma from '@/lib/db';

/**
 * Handler pour lister les utilisateurs
 */
const getUsersHandler = async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  
  // Validation des paramètres de pagination
  const paginationData = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
  };
  
  const validation = paginationSchema.safeParse(paginationData);
  if (!validation.success) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Paramètres de pagination invalides',
        details: validation.error.format()
      },
      { status: 400 }
    );
  }
  
  const { page, limit, sortBy, sortOrder } = validation.data;
  const search = searchParams.get('search');
  
  try {
    // Construire la requête de recherche
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { company: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};
    
    // Compter le nombre total d'utilisateurs
    const total = await prisma.user.count({ where });
    
    // Récupérer les utilisateurs avec pagination
    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy === 'createdAt' ? { createdAt: sortOrder } : 
               sortBy === 'name' ? { name: sortOrder } :
               sortBy === 'email' ? { email: sortOrder } :
               { createdAt: sortOrder },
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
        // Exclure le mot de passe
      }
    });
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
};

/**
 * Handler pour créer un utilisateur
 */
const createUserHandler = async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json();
  
  // Validation des données d'entrée
  const validation = createUserSchema.safeParse(body);
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
  const normalizedEmail = normalizeEmail(email);
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un utilisateur avec cet email existe déjà' },
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
        role,
        phone,
        company,
        address,
      },
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
        // Exclure le mot de passe
      }
    });
    
    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'Utilisateur créé avec succès'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
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
      return getUsersHandler(req);
    case 'POST':
      return createUserHandler(req);
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
  (handler) => withMethodValidation(['GET', 'POST'], handler),
  withAdminAuth
)(mainHandler);

export { handler as GET, handler as POST };
