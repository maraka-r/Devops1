import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  ClientSearchResponse, 
  ClientSearchResult,
  UserRole,
  UserStatus
} from '@/types';

// GET /api/search/clients - Recherche avancée de clients (Admin uniquement)
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

    // Vérifier que l'utilisateur a les permissions admin
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

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Accès refusé - Privilèges administrateur requis' 
        },
        { status: 403 }
      );
    }
    
    // Extraction des paramètres de recherche
    const query = searchParams.get('query') || '';
    const role = searchParams.get('role') as UserRole | null;
    const status = searchParams.get('status') as UserStatus | null;
    const company = searchParams.get('company');
    const registeredFrom = searchParams.get('registeredFrom');
    const registeredTo = searchParams.get('registeredTo');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const offset = (page - 1) * limit;

    // Construction des filtres de base
    const whereClause: Record<string, unknown> = {};

    // Recherche textuelle dans le nom, email et entreprise
    if (query) {
      whereClause.OR = [
        {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          company: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Filtres par rôle
    if (role) {
      whereClause.role = role;
    }

    // Filtres par statut
    if (status) {
      whereClause.status = status;
    }

    // Filtres par entreprise
    if (company) {
      whereClause.company = {
        contains: company,
        mode: 'insensitive'
      };
    }

    // Filtres par date d'inscription
    if (registeredFrom || registeredTo) {
      whereClause.createdAt = {};
      if (registeredFrom) {
        (whereClause.createdAt as Record<string, unknown>).gte = new Date(registeredFrom);
      }
      if (registeredTo) {
        (whereClause.createdAt as Record<string, unknown>).lte = new Date(registeredTo);
      }
    }

    // Construction de l'ordre de tri
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'email':
        orderBy.email = sortOrder;
        break;
      case 'company':
        orderBy.company = sortOrder;
        break;
      case 'created':
        orderBy.createdAt = sortOrder;
        break;
      case 'lastActivity':
        // Pour le tri par dernière activité, on utilisera la dernière location
        orderBy.createdAt = sortOrder; // Fallback
        break;
      default:
        orderBy.name = 'asc';
    }

    const startTime = Date.now();

    // Exécution de la recherche avec statistiques
    const [clients, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          company: true,
          address: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          locations: {
            select: {
              id: true,
              totalPrice: true,
              createdAt: true,
              endDate: true,
              status: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              locations: true,
              favoris: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Calcul des facettes
    const [roleFacets, statusFacets, companyFacets] = await Promise.all([
      // Facettes par rôle
      prisma.user.groupBy({
        by: ['role'],
        where: whereClause,
        _count: {
          role: true
        }
      }),
      // Facettes par statut
      prisma.user.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
          status: true
        }
      }),
      // Top entreprises
      prisma.user.groupBy({
        by: ['company'],
        where: {
          ...whereClause,
          company: {
            not: null
          }
        },
        _count: {
          company: true
        },
        orderBy: {
          _count: {
            company: 'desc'
          }
        },
        take: 10
      })
    ]);

    // Transformation des résultats avec calcul des statistiques
    const results: ClientSearchResult[] = clients.map(client => {
      // Calcul des statistiques client
      const totalSpent = client.locations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
      const lastLocation = client.locations[0];
      
      // Calcul du score de pertinence
      let relevanceScore = 1.0;
      if (query) {
        const queryLower = query.toLowerCase();
        const nameMatch = client.name.toLowerCase().includes(queryLower);
        const emailMatch = client.email.toLowerCase().includes(queryLower);
        const companyMatch = client.company?.toLowerCase().includes(queryLower);
        
        relevanceScore = nameMatch ? 1.0 : (emailMatch ? 0.9 : (companyMatch ? 0.8 : 0.5));
      }

      // Highlights pour la recherche textuelle
      const highlights = [];
      if (query) {
        const queryLower = query.toLowerCase();
        if (client.name.toLowerCase().includes(queryLower)) {
          highlights.push({
            field: 'name',
            value: client.name,
            matchedText: query
          });
        }
        if (client.email.toLowerCase().includes(queryLower)) {
          highlights.push({
            field: 'email',
            value: client.email,
            matchedText: query
          });
        }
        if (client.company?.toLowerCase().includes(queryLower)) {
          highlights.push({
            field: 'company',
            value: client.company,
            matchedText: query
          });
        }
      }

      // Préparation de l'objet client sans le mot de passe
      const clientWithoutPassword = {
        id: client.id,
        name: client.name,
        email: client.email,
        role: client.role,
        status: client.status,
        phone: client.phone,
        company: client.company,
        address: client.address,
        avatar: client.avatar,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      };

      return {
        id: client.id,
        relevanceScore,
        highlights,
        item: {
          ...clientWithoutPassword,
          stats: {
            totalLocations: client._count.locations,
            totalSpent,
            lastLocationDate: lastLocation?.createdAt.toISOString(),
            averageOrderValue: client._count.locations > 0 ? totalSpent / client._count.locations : 0
          }
        }
      };
    });

    const searchTime = Date.now() - startTime;

    // Construction de la réponse
    const response: ClientSearchResponse = {
      success: true,
      data: {
        results,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        facets: {
          types: roleFacets.map(f => ({ type: f.role, count: f._count.role })),
          statuses: statusFacets.map(f => ({ status: f.status, count: f._count.status })),
          categories: companyFacets.map(f => ({ 
            category: f.company || 'Sans entreprise', 
            count: f._count.company 
          }))
        },
        suggestions: query ? await generateClientSearchSuggestions(query) : [],
        searchTime
      },
      message: `${totalCount} client(s) trouvé(s)`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la recherche de clients:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la recherche de clients' 
      },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour générer des suggestions de recherche pour les clients
async function generateClientSearchSuggestions(query: string): Promise<string[]> {
  try {
    const suggestions = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            company: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        name: true,
        company: true
      },
      take: 5
    });

    const suggestionSet = new Set<string>();
    suggestions.forEach(s => {
      suggestionSet.add(s.name);
      if (s.company) {
        suggestionSet.add(s.company);
      }
    });

    return Array.from(suggestionSet).slice(0, 5);
  } catch {
    return [];
  }
}
