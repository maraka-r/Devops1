import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BulkNotificationResponse } from '@/types';

// POST /api/notifications/mark-all-read - Marquer toutes les notifications comme lues
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // Validation du userId
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID utilisateur requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Utilisateur non trouvé' 
        },
        { status: 404 }
      );
    }

    // Compter les notifications non lues
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    });

    if (unreadCount === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Aucune notification non lue trouvée' 
        },
        { status: 404 }
      );
    }

    // Marquer toutes les notifications non lues comme lues
    const updateResult = await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Récupérer les notifications mises à jour pour la réponse
    const updatedNotifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        readAt: {
          gte: new Date(Date.now() - 1000) // Dans la dernière seconde
        }
      },
      orderBy: {
        readAt: 'desc'
      },
      take: 50 // Limite pour éviter des réponses trop volumineuses
    });

    const formattedNotifications = updatedNotifications.map(notification => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data as Record<string, unknown> | null,
      isRead: notification.isRead,
      priority: notification.priority,
      createdAt: notification.createdAt,
      readAt: notification.readAt
    }));

    const response: BulkNotificationResponse = {
      success: true,
      message: `${updateResult.count} notification(s) marquée(s) comme lue(s)`,
      data: {
        affectedCount: updateResult.count,
        notifications: formattedNotifications
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la mise à jour des notifications' 
      },
      { status: 500 }
    );
  }
}
