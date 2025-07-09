import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Upload d'avatar utilisateur
async function postHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Validation de la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Taille maximum: 5MB' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    
    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Le dossier existe déjà, ignorer l'erreur
    }

    // Sauvegarder le fichier
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL public du fichier
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Mettre à jour l'utilisateur dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        avatar: avatarUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        company: true,
        phone: true,
        address: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      avatarUrl,
    });

  } catch (error) {
    console.error('Erreur upload avatar:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Supprimer l'avatar utilisateur
async function deleteHandler(request: AuthenticatedRequest) {
  try {
    const userId = request.user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Mettre à jour l'utilisateur pour supprimer l'avatar
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        avatar: null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        company: true,
        phone: true,
        address: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    console.error('Erreur suppression avatar:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Appliquer le middleware d'authentification
export const POST = withAuth(postHandler);
export const DELETE = withAuth(deleteHandler);
