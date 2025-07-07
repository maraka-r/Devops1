import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationStats } from '@/types';

// GET /api/notifications/stats - Statistiques des notifications
export async function GET(request: NextRequest) {
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

    // Récupérer toutes les notifications de l'utilisateur
    const allNotifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculer les statistiques
    const total = allNotifications.length;
    const unread = allNotifications.filter(n => !n.isRead).length;
    const read = total - unread;

    // Statistiques par type
    const byType: Record<string, number> = {};
    allNotifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    });

    // Statistiques par priorité
    const byPriority: Record<string, number> = {};
    allNotifications.forEach(notification => {
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
    });

    // Notifications récentes (10 dernières)
    const recent = allNotifications.slice(0, 10).map(notification => ({
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

    const stats: NotificationStats = {
      total,
      unread,
      read,
      byType,
      byPriority,
      recent
    };

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Statistiques des notifications récupérées'
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des statistiques' 
      },
      { status: 500 }
    );
  }
}
