import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/support/stats - Statistiques du support
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '30'; // 30 derniers jours par défaut
    
    // Validation du userId (optionnel pour les admins)
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID utilisateur requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe et récupérer son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
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

    // Calculer la date de début basée sur la période
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Construire les filtres selon le rôle
    const whereClause = user.role === 'ADMIN' 
      ? { createdAt: { gte: startDate } } // Admin voit tout
      : { userId: userId, createdAt: { gte: startDate } }; // Utilisateur ne voit que ses tickets

    // Statistiques générales
    const [
      totalTickets,
      ticketsByStatus,
      ticketsByCategory,
      ticketsByPriority,
      recentTickets,
      avgResponseTime
    ] = await Promise.all([
      // Total des tickets
      prisma.supportTicket.count({
        where: whereClause
      }),

      // Tickets par statut
      prisma.supportTicket.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true
      }),

      // Tickets par catégorie
      prisma.supportTicket.groupBy({
        by: ['category'],
        where: whereClause,
        _count: true
      }),

      // Tickets par priorité
      prisma.supportTicket.groupBy({
        by: ['priority'],
        where: whereClause,
        _count: true
      }),

      // 5 tickets les plus récents
      prisma.supportTicket.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              replies: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }),

      // Temps de réponse moyen (première réponse d'un admin)
      user.role === 'ADMIN' ? prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (sr.created_at - st.created_at))) as avg_seconds
        FROM support_replies sr
        JOIN support_tickets st ON sr.ticket_id = st.id
        JOIN users u ON sr.user_id = u.id
        WHERE u.role = 'ADMIN'
        AND sr.created_at >= ${startDate}
        AND sr.id IN (
          SELECT MIN(sr2.id)
          FROM support_replies sr2
          JOIN users u2 ON sr2.user_id = u2.id
          WHERE sr2.ticket_id = sr.ticket_id
          AND u2.role = 'ADMIN'
          GROUP BY sr2.ticket_id
        )
      ` : null
    ]);

    // Formatter les statistiques par statut
    const statusStats = {
      OPEN: 0,
      IN_PROGRESS: 0,
      PENDING: 0,
      RESOLVED: 0,
      CLOSED: 0
    };

    ticketsByStatus.forEach(stat => {
      statusStats[stat.status as keyof typeof statusStats] = stat._count;
    });

    // Formatter les statistiques par catégorie
    const categoryStats: Record<string, number> = {};
    ticketsByCategory.forEach(stat => {
      categoryStats[stat.category] = stat._count;
    });

    // Formatter les statistiques par priorité
    const priorityStats: Record<string, number> = {};
    ticketsByPriority.forEach(stat => {
      priorityStats[stat.priority] = stat._count;
    });

    // Formatter les tickets récents
    const formattedRecentTickets = recentTickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      user: {
        id: ticket.user.id,
        name: ticket.user.name,
        email: ticket.user.email
      },
      repliesCount: ticket._count.replies
    }));

    // Calculer le temps de réponse moyen en heures
    const avgResponseTimeHours = avgResponseTime && Array.isArray(avgResponseTime) && avgResponseTime[0]
      ? Math.round(((avgResponseTime[0] as { avg_seconds: number }).avg_seconds / 3600) * 100) / 100
      : null;

    // Calculer les métriques de performance
    const openTickets = statusStats.OPEN + statusStats.IN_PROGRESS;
    const resolvedTickets = statusStats.RESOLVED + statusStats.CLOSED;
    const resolutionRate = totalTickets > 0 
      ? Math.round((resolvedTickets / totalTickets) * 100)
      : 0;

    const response = {
      success: true,
      data: {
        period: `${daysAgo} derniers jours`,
        overview: {
          total: totalTickets,
          open: openTickets,
          resolved: resolvedTickets,
          resolutionRate: resolutionRate
        },
        byStatus: statusStats,
        byCategory: categoryStats,
        byPriority: priorityStats,
        performance: {
          avgResponseTimeHours: avgResponseTimeHours,
          totalResolved: resolvedTickets,
          resolutionRate: resolutionRate
        },
        recentTickets: formattedRecentTickets
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la récupération des statistiques' 
      },
      { status: 500 }
    );
  }
}
