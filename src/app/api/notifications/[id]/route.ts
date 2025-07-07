import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationActionResponse } from '@/types';

// PUT /api/notifications/[id]/read - Marquer une notification comme lue
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // Validation des paramètres
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID utilisateur requis' 
        },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID notification requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier que la notification existe et appartient à l'utilisateur
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!existingNotification) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Notification non trouvée ou non autorisée' 
        },
        { status: 404 }
      );
    }

    // Vérifier si déjà marquée comme lue
    if (existingNotification.isRead) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Notification déjà marquée comme lue' 
        },
        { status: 409 }
      );
    }

    // Marquer comme lue
    const updatedNotification = await prisma.notification.update({
      where: { id: id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    const response: NotificationActionResponse = {
      success: true,
      message: 'Notification marquée comme lue',
      data: {
        id: updatedNotification.id,
        isRead: updatedNotification.isRead,
        readAt: updatedNotification.readAt
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la mise à jour de la notification' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Supprimer une notification
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // Validation des paramètres
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID utilisateur requis' 
        },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID notification requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier que la notification existe et appartient à l'utilisateur
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!existingNotification) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Notification non trouvée ou non autorisée' 
        },
        { status: 404 }
      );
    }

    // Supprimer la notification
    await prisma.notification.delete({
      where: { id: id }
    });

    const response: NotificationActionResponse = {
      success: true,
      message: 'Notification supprimée avec succès'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la suppression de la notification' 
      },
      { status: 500 }
    );
  }
}
