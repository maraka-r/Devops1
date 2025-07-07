import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SupportActionResponse, SupportTicketResponse } from '@/types';

// PUT /api/support/tickets/[id]/close - Fermer un ticket de support
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

    // Vérifier que le ticket n'est pas déjà fermé
    if (ticket.status === 'CLOSED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le ticket est déjà fermé' 
        },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a le droit de fermer le ticket
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

    // Seul le propriétaire ou un admin peut fermer le ticket
    if (ticket.userId !== userId && user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Vous n\'avez pas l\'autorisation de fermer ce ticket' 
        },
        { status: 403 }
      );
    }

    // Fermer le ticket
    const closedTicket = await prisma.supportTicket.update({
      where: { id: id },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
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
      id: closedTicket.id,
      title: closedTicket.title,
      description: closedTicket.description,
      category: closedTicket.category,
      priority: closedTicket.priority,
      status: closedTicket.status,
      userId: closedTicket.userId,
      assignedToId: closedTicket.assignedToId || undefined,
      assignedTo: closedTicket.assignedTo ? {
        id: closedTicket.assignedTo.id,
        name: closedTicket.assignedTo.name,
        email: closedTicket.assignedTo.email
      } : undefined,
      createdAt: closedTicket.createdAt.toISOString(),
      updatedAt: closedTicket.updatedAt.toISOString(),
      closedAt: closedTicket.closedAt?.toISOString(),
      user: {
        id: closedTicket.user.id,
        name: closedTicket.user.name,
        email: closedTicket.user.email
      },
      repliesCount: closedTicket._count.replies
    };

    const response: SupportActionResponse = {
      success: true,
      message: 'Ticket fermé avec succès',
      data: {
        ticket: formattedTicket
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la fermeture du ticket:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la fermeture du ticket' 
      },
      { status: 500 }
    );
  }
}
