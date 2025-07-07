import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  SupportReplyRequest, 
  SupportReplyResponse, 
  SupportActionResponse 
} from '@/types';

// POST /api/support/tickets/[id]/reply - Répondre à un ticket de support
export async function POST(
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

    // Vérifier que le ticket existe et est accessible
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: id,
        OR: [
          { userId: userId }, // Propriétaire du ticket
          { assignedToId: userId } // Assigné au ticket (support)
        ]
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

    // Vérifier que le ticket n'est pas fermé
    if (ticket.status === 'CLOSED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Impossible de répondre à un ticket fermé' 
        },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
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
    const body: SupportReplyRequest = await request.json();
    
    // Validation des données
    if (!body.message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Message requis' 
        },
        { status: 400 }
      );
    }

    if (body.message.length < 1 || body.message.length > 5000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le message doit contenir entre 1 et 5000 caractères' 
        },
        { status: 400 }
      );
    }

    // Vérifier les permissions pour les réponses internes
    const isInternal = body.isInternal && user.role === 'ADMIN';

    // Créer la réponse
    const reply = await prisma.supportReply.create({
      data: {
        ticketId: id,
        userId: userId,
        message: body.message,
        isInternal: isInternal || false,
        attachments: body.attachments ? JSON.parse(JSON.stringify(body.attachments)) : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Mettre à jour le statut du ticket si nécessaire
    let ticketUpdated = false;
    if (ticket.status === 'PENDING' && userId === ticket.userId) {
      // Le client répond, passer en "OPEN"
      await prisma.supportTicket.update({
        where: { id: id },
        data: { status: 'OPEN' }
      });
      ticketUpdated = true;
    } else if (ticket.status === 'OPEN' && userId === ticket.assignedToId) {
      // Le support répond, passer en "IN_PROGRESS"
      await prisma.supportTicket.update({
        where: { id: id },
        data: { status: 'IN_PROGRESS' }
      });
      ticketUpdated = true;
    }

    // Récupérer le ticket mis à jour si nécessaire
    let updatedTicketData = null;
    if (ticketUpdated) {
      const freshTicket = await prisma.supportTicket.findUnique({
        where: { id: id },
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

      if (freshTicket) {
        updatedTicketData = {
          id: freshTicket.id,
          title: freshTicket.title,
          description: freshTicket.description,
          category: freshTicket.category,
          priority: freshTicket.priority,
          status: freshTicket.status,
          userId: freshTicket.userId,
          assignedToId: freshTicket.assignedToId || undefined,
          assignedTo: freshTicket.assignedTo ? {
            id: freshTicket.assignedTo.id,
            name: freshTicket.assignedTo.name,
            email: freshTicket.assignedTo.email
          } : undefined,
          createdAt: freshTicket.createdAt.toISOString(),
          updatedAt: freshTicket.updatedAt.toISOString(),
          closedAt: freshTicket.closedAt?.toISOString(),
          user: {
            id: freshTicket.user.id,
            name: freshTicket.user.name,
            email: freshTicket.user.email
          },
          repliesCount: freshTicket._count.replies
        };
      }
    }

    // Formatter la réponse
    const formattedReply: SupportReplyResponse = {
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
    };

    const response: SupportActionResponse = {
      success: true,
      message: 'Réponse ajoutée avec succès',
      data: {
        ticket: updatedTicketData || undefined,
        reply: formattedReply
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de la réponse:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la création de la réponse' 
      },
      { status: 500 }
    );
  }
}
