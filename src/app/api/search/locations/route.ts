import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  LocationSearchResponse, 
  LocationSearchResult,
  LocationStatus
} from '@/types';

// GET /api/search/locations - Recherche avancée de locations
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
    
    // Extraction des paramètres de recherche
    const query = searchParams.get('query') || '';
    const materielId = searchParams.get('materielId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status') as LocationStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const totalMin = searchParams.get('totalMin') ? parseFloat(searchParams.get('totalMin')!) : null;
    const totalMax = searchParams.get('totalMax') ? parseFloat(searchParams.get('totalMax')!) : null;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const offset = (page - 1) * limit;

    // Construction des filtres de base
    const whereClause: Record<string, unknown> = {};

    // Si l'utilisateur n'est pas admin, il ne peut voir que ses propres locations
    if (user.role !== 'ADMIN') {
      whereClause.userId = userId;
    }

    // Recherche textuelle dans les notes et informations liées
    if (query) {
      whereClause.OR = [
        {
          notes: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          user: {
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
          }
        },
        {
          materiel: {
            OR: [
              {
                name: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                description: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      ];
    }

    // Filtres par matériel
    if (materielId) {
      whereClause.materielId = materielId;
    }

    // Filtres par client (admin uniquement)
    if (clientId && user.role === 'ADMIN') {
      whereClause.userId = clientId;
    }

    // Filtres par statut
    if (status) {
      whereClause.status = status;
    }

    // Filtres par dates de location
    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      whereClause.startDate = dateFilter;
    }

    // Filtres par montant total
    if (totalMin !== null || totalMax !== null) {
      const totalFilter: Record<string, number> = {};
      if (totalMin !== null) {
        totalFilter.gte = totalMin;
      }
      if (totalMax !== null) {
        totalFilter.lte = totalMax;
      }
      whereClause.totalPrice = totalFilter;
    }

    // Construction de l'ordre de tri
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    switch (sortBy) {
      case 'startDate':
        orderBy.startDate = sortOrder;
        break;
      case 'endDate':
        orderBy.endDate = sortOrder;
        break;
      case 'totalPrice':
        orderBy.totalPrice = sortOrder;
        break;
      case 'status':
        orderBy.status = sortOrder;
        break;
      case 'created':
        orderBy.createdAt = sortOrder;
        break;
      case 'updated':
        orderBy.updatedAt = sortOrder;
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const startTime = Date.now();

    // Exécution de la recherche avec informations détaillées
    const [locations, totalCount] = await Promise.all([
      prisma.location.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
              phone: true
            }
          },
          materiel: {
            select: {
              id: true,
              name: true,
              type: true,
              pricePerDay: true,
              description: true,
              images: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.location.count({ where: whereClause })
    ]);

    // Calcul des facettes
    const [statusFacets, materialTypeFacets, durationFacets] = await Promise.all([
      // Facettes par statut
      prisma.location.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
          status: true
        }
      }),
      // Facettes par type de matériel
      prisma.location.findMany({
        where: whereClause,
        select: {
          materiel: {
            select: {
              type: true
            }
          }
        }
      }).then(locations => {
        const typeCount: Record<string, number> = {};
        locations.forEach(loc => {
          const type = loc.materiel.type;
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
        return Object.entries(typeCount).map(([type, count]) => ({ type, count }));
      }),
      // Facettes par durée de location
      prisma.location.findMany({
        where: whereClause,
        select: {
          startDate: true,
          endDate: true
        }
      }).then(locations => {
        const durationRanges = {
          '1-3 jours': 0,
          '4-7 jours': 0,
          '1-2 semaines': 0,
          '2+ semaines': 0
        };
        
        locations.forEach(loc => {
          const duration = Math.ceil((loc.endDate.getTime() - loc.startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (duration <= 3) durationRanges['1-3 jours']++;
          else if (duration <= 7) durationRanges['4-7 jours']++;
          else if (duration <= 14) durationRanges['1-2 semaines']++;
          else durationRanges['2+ semaines']++;
        });
        
        return Object.entries(durationRanges).map(([range, count]) => ({ range, count }));
      })
    ]);

    // Transformation des résultats
    const results: LocationSearchResult[] = locations.map(location => {
      // Calcul du score de pertinence
      let relevanceScore = 1.0;
      if (query) {
        const queryLower = query.toLowerCase();
        const notesMatch = location.notes?.toLowerCase().includes(queryLower);
        const userMatch = location.user.name.toLowerCase().includes(queryLower) ||
                          location.user.email.toLowerCase().includes(queryLower) ||
                          location.user.company?.toLowerCase().includes(queryLower);
        const materielMatch = location.materiel.name.toLowerCase().includes(queryLower) ||
                             location.materiel.description?.toLowerCase().includes(queryLower);
        
        relevanceScore = notesMatch ? 1.0 : (userMatch ? 0.9 : (materielMatch ? 0.8 : 0.5));
      }

      // Highlights pour la recherche textuelle
      const highlights = [];
      if (query) {
        const queryLower = query.toLowerCase();
        if (location.notes?.toLowerCase().includes(queryLower)) {
          highlights.push({
            field: 'notes',
            value: location.notes,
            matchedText: query
          });
        }
        if (location.user.name.toLowerCase().includes(queryLower)) {
          highlights.push({
            field: 'user.name',
            value: location.user.name,
            matchedText: query
          });
        }
        if (location.materiel.name.toLowerCase().includes(queryLower)) {
          highlights.push({
            field: 'materiel.name',
            value: location.materiel.name,
            matchedText: query
          });
        }
      }

      return {
        id: location.id,
        relevanceScore,
        highlights,
        item: {
          ...location,
          user: {
            id: location.user.id,
            name: location.user.name,
            email: location.user.email,
            company: location.user.company
          },
          materiel: {
            id: location.materiel.id,
            name: location.materiel.name,
            type: location.materiel.type,
            pricePerDay: location.materiel.pricePerDay
          }
        }
      };
    });

    const searchTime = Date.now() - startTime;

    // Construction de la réponse
    const response: LocationSearchResponse = {
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
          statuses: statusFacets.map(f => ({ status: f.status, count: f._count.status })),
          types: materialTypeFacets,
          categories: durationFacets.map(f => ({ category: f.range, count: f.count }))
        },
        suggestions: query ? await generateLocationSearchSuggestions(query, whereClause) : [],
        searchTime
      },
      message: `${totalCount} location(s) trouvée(s)`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la recherche de locations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la recherche de locations' 
      },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour générer des suggestions de recherche pour les locations
async function generateLocationSearchSuggestions(
  query: string, 
  baseWhereClause: Record<string, unknown>
): Promise<string[]> {
  try {
    const suggestions = await prisma.location.findMany({
      where: {
        ...baseWhereClause,
        OR: [
          {
            notes: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            user: {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            }
          },
          {
            materiel: {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      select: {
        user: {
          select: {
            name: true,
            company: true
          }
        },
        materiel: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });

    const suggestionSet = new Set<string>();
    suggestions.forEach(s => {
      suggestionSet.add(s.user.name);
      suggestionSet.add(s.materiel.name);
      if (s.user.company) {
        suggestionSet.add(s.user.company);
      }
    });

    return Array.from(suggestionSet).slice(0, 5);
  } catch {
    return [];
  }
}
