import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  SupportTicketDetailResponse, 
  SupportTicketResponse, 
  SupportReplyResponse, 
  SupportActionResponse 
} from '@/types';

// GET /api/support/tickets/[id] - Détails d'un ticket de support
export async function GET(
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
          error: 'ID ticket requis' 
        },
        { status: 400 }
      );
    }

    // Récupérer le ticket avec toutes ses relations
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: id,
        userId: userId // Vérifier que l'utilisateur a accès au ticket
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
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ticket non trouvé ou non autorisé' 
        },
        { status: 404 }
      );
    }

    // Formatter le ticket
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

    // Formatter les réponses
    const formattedReplies: SupportReplyResponse[] = ticket.replies.map(reply => ({
      id: reply.id,
      ticketId: reply.ticketId,
      userId: reply.userId,
      message: reply.message,
      isInternal: reply.isInternal,
      attachments: reply.attachments ? JSON.parse(JSON.stringify(reply.attachments)) : undefined,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      user: {
        id: reply.user.id,
        name: reply.user.name,
        email: reply.user.email
      }
    }));

    const response: SupportTicketDetailResponse = {
      success: true,
      data: {
        ticket: formattedTicket,
        replies: formattedReplies
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération du ticket:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la récupération du ticket' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/support/tickets/[id] - Modifier un ticket de support (statut, priorité, etc.)
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
          error: 'ID ticket requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier que le ticket existe et appartient à l'utilisateur
    const existingTicket = await prisma.supportTicket.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!existingTicket) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ticket non trouvé ou non autorisé' 
        },
        { status: 404 }
      );
    }

    // Parser le body de la requête
    const body = await request.json();
    
    // Préparer les données à mettre à jour
    const updateData: Record<string, unknown> = {};
    
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.length < 3 || body.title.length > 200) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Le titre doit contenir entre 3 et 200 caractères' 
          },
          { status: 400 }
        );
      }
      updateData.title = body.title;
    }

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.length < 10 || body.description.length > 5000) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'La description doit contenir entre 10 et 5000 caractères' 
          },
          { status: 400 }
        );
      }
      updateData.description = body.description;
    }

    if (body.category !== undefined) {
      updateData.category = body.category;
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }

    // Mettre à jour le ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: id },
      data: updateData,
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
      id: updatedTicket.id,
      title: updatedTicket.title,
      description: updatedTicket.description,
      category: updatedTicket.category,
      priority: updatedTicket.priority,
      status: updatedTicket.status,
      userId: updatedTicket.userId,
      assignedToId: updatedTicket.assignedToId || undefined,
      assignedTo: updatedTicket.assignedTo ? {
        id: updatedTicket.assignedTo.id,
        name: updatedTicket.assignedTo.name,
        email: updatedTicket.assignedTo.email
      } : undefined,
      createdAt: updatedTicket.createdAt.toISOString(),
      updatedAt: updatedTicket.updatedAt.toISOString(),
      closedAt: updatedTicket.closedAt?.toISOString(),
      user: {
        id: updatedTicket.user.id,
        name: updatedTicket.user.name,
        email: updatedTicket.user.email
      },
      repliesCount: updatedTicket._count.replies
    };

    const response: SupportActionResponse = {
      success: true,
      message: 'Ticket mis à jour avec succès',
      data: {
        ticket: formattedTicket
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la mise à jour du ticket:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la mise à jour du ticket' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/support/tickets/[id] - Supprimer un ticket de support
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
          error: 'ID ticket requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier que le ticket existe et appartient à l'utilisateur
    const existingTicket = await prisma.supportTicket.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!existingTicket) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ticket non trouvé ou non autorisé' 
        },
        { status: 404 }
      );
    }

    // Supprimer le ticket (cascade pour les réponses)
    await prisma.supportTicket.delete({
      where: { id: id }
    });

    const response: SupportActionResponse = {
      success: true,
      message: 'Ticket supprimé avec succès'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la suppression du ticket:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la suppression du ticket' 
      },
      { status: 500 }
    );
  }
}
