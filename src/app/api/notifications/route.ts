import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationListResponse, NotificationFilters, NotificationType, NotificationPriority } from '@/types';

// GET /api/notifications - Liste des notifications pour l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') as NotificationType | null;
    const priority = searchParams.get('priority') as NotificationPriority | null;
    const isRead = searchParams.get('isRead');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Validation du userId (normalement récupéré du token JWT)
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID utilisateur requis' 
        },
        { status: 400 }
      );
    }

    // Validation de la pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Paramètres de pagination invalides (page >= 1, limit entre 1 et 100)' 
        },
        { status: 400 }
      );
    }

    // Construction des filtres
    const filters: NotificationFilters = {};
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (isRead !== null) filters.isRead = isRead === 'true';
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Construction de la clause where
    const whereClause: Record<string, unknown> = {
      userId: userId,
      ...(filters.type && { type: filters.type }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.isRead !== undefined && { isRead: filters.isRead }),
      ...(filters.startDate || filters.endDate) && {
        createdAt: {
          ...(filters.startDate && { gte: filters.startDate }),
          ...(filters.endDate && { lte: filters.endDate })
        }
      }
    };

    // Compter le total et les non lues
    const [total, unread] = await Promise.all([
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ 
        where: { ...whereClause, isRead: false } 
      })
    ]);

    // Récupérer les notifications paginées
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' }, // Priorité en premier
        { createdAt: 'desc' }  // Puis par date
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    // Formatter les données pour la réponse
    const formattedNotifications = notifications.map(notification => ({
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

    const totalPages = Math.ceil(total / limit);

    const response: NotificationListResponse = {
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          total,
          unread,
          page,
          limit,
          totalPages
        }
      },
      message: `${formattedNotifications.length} notification(s) trouvée(s)`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des notifications' 
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Créer une nouvelle notification (pour les admins/système)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      type, 
      title, 
      message, 
      data = null, 
      priority = 'NORMAL' 
    } = body;
    
    // Validation des champs requis
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Champs requis: userId, type, title, message' 
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

    // Créer la notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || null,
        priority,
        isRead: false
      }
    });

    const response = {
      success: true,
      message: 'Notification créée avec succès',
      data: {
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
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la création de la notification' 
      },
      { status: 500 }
    );
  }
}
