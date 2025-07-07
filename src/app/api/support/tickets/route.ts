import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  SupportTicketListResponse, 
  SupportTicketRequest, 
  SupportTicketResponse, 
  SupportActionResponse,
  SupportFilters,
  SupportCategory,
  SupportPriority,
  SupportStatus
} from '@/types';

// GET /api/support/tickets - Liste des tickets de support
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') as SupportCategory | null;
    const priority = searchParams.get('priority') as SupportPriority | null;
    const status = searchParams.get('status') as SupportStatus | null;
    const assignedToId = searchParams.get('assignedToId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
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
    const filters: SupportFilters = {};
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    if (status) filters.status = status;
    if (assignedToId) filters.assignedToId = assignedToId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Construction de la clause where
    const whereClause: Record<string, unknown> = {
      userId: userId,
    };

    if (filters.category) whereClause.category = filters.category;
    if (filters.priority) whereClause.priority = filters.priority;
    if (filters.status) whereClause.status = filters.status;
    if (filters.assignedToId) whereClause.assignedToId = filters.assignedToId;
    
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        (whereClause.createdAt as Record<string, unknown>).gte = filters.startDate;
      }
      if (filters.endDate) {
        (whereClause.createdAt as Record<string, unknown>).lte = filters.endDate;
      }
    }

    // Calculer le skip pour la pagination
    const skip = (page - 1) * limit;

    // Récupérer les tickets avec les relations
    const [tickets, totalCount] = await Promise.all([
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
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          replies: {
            select: {
              id: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
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
        skip: skip,
        take: limit
      }),
      prisma.supportTicket.count({
        where: whereClause
      })
    ]);

    // Calculer les statistiques
    const stats = await prisma.supportTicket.groupBy({
      by: ['status'],
      where: { userId: userId },
      _count: true
    });

    const statsObj = {
      total: totalCount,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      switch (stat.status) {
        case 'OPEN':
          statsObj.open = stat._count;
          break;
        case 'IN_PROGRESS':
          statsObj.inProgress = stat._count;
          break;
        case 'RESOLVED':
          statsObj.resolved = stat._count;
          break;
        case 'CLOSED':
          statsObj.closed = stat._count;
          break;
      }
    });

    // Formatter les tickets
    const formattedTickets: SupportTicketResponse[] = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      userId: ticket.userId,
      assignedToId: ticket.assignedToId || undefined,
      assignedTo: ticket.assignedTo ? {
        id: ticket.assignedTo.id,
        name: ticket.assignedTo.name,
        email: ticket.assignedTo.email
      } : undefined,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      closedAt: ticket.closedAt?.toISOString(),
      user: {
        id: ticket.user.id,
        name: ticket.user.name,
        email: ticket.user.email
      },
      repliesCount: ticket._count.replies,
      lastReplyAt: ticket.replies[0]?.createdAt.toISOString()
    }));

    // Calculer les pages
    const totalPages = Math.ceil(totalCount / limit);

    const response: SupportTicketListResponse = {
      success: true,
      data: {
        tickets: formattedTickets,
        pagination: {
          page: page,
          limit: limit,
          total: totalCount,
          pages: totalPages
        },
        stats: statsObj
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la récupération des tickets' 
      },
      { status: 500 }
    );
  }
}

// POST /api/support/tickets - Créer un nouveau ticket de support
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
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
      select: { id: true, name: true, email: true }
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

    // Parser le body de la requête
    const body: SupportTicketRequest = await request.json();
    
    // Validation des données
    if (!body.title || !body.description || !body.category) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Titre, description et catégorie sont requis' 
        },
        { status: 400 }
      );
    }

    if (body.title.length < 3 || body.title.length > 200) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le titre doit contenir entre 3 et 200 caractères' 
        },
        { status: 400 }
      );
    }

    if (body.description.length < 10 || body.description.length > 5000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La description doit contenir entre 10 et 5000 caractères' 
        },
        { status: 400 }
      );
    }

    // Créer le ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority || 'NORMAL',
        userId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
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
      }
    });

    // Formatter la réponse
    const formattedTicket: SupportTicketResponse = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      userId: ticket.userId,
      assignedToId: ticket.assignedToId || undefined,
      assignedTo: ticket.assignedTo ? {
        id: ticket.assignedTo.id,
        name: ticket.assignedTo.name,
        email: ticket.assignedTo.email
      } : undefined,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      closedAt: ticket.closedAt?.toISOString(),
      user: {
        id: ticket.user.id,
        name: ticket.user.name,
        email: ticket.user.email
      },
      repliesCount: ticket._count.replies
    };

    const response: SupportActionResponse = {
      success: true,
      message: 'Ticket créé avec succès',
      data: {
        ticket: formattedTicket
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la création du ticket' 
      },
      { status: 500 }
    );
  }
}
