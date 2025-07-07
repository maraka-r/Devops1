import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  MaterialSearchResponse, 
  MaterialSearchResult,
  MaterielType,
  MaterielStatus
} from '@/types';

// GET /api/search/materials - Recherche avancée de matériels
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extraction des paramètres de recherche
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') as MaterielType | null;
    const status = searchParams.get('status') as MaterielStatus | null;
    const priceMin = searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : null;
    const priceMax = searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : null;
    const availableFrom = searchParams.get('availableFrom');
    const availableTo = searchParams.get('availableTo');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Limite max de 100

    const offset = (page - 1) * limit;

    // Construction des filtres de base
    const whereClause: Record<string, unknown> = {};

    // Recherche textuelle dans le nom et la description
    if (query) {
      whereClause.OR = [
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
      ];
    }

    // Filtres par type
    if (type) {
      whereClause.type = type;
    }

    // Filtres par statut
    if (status) {
      whereClause.status = status;
    }

    // Filtres par prix
    if (priceMin !== null || priceMax !== null) {
      const priceFilter: Record<string, number> = {};
      if (priceMin !== null) {
        priceFilter.gte = priceMin;
      }
      if (priceMax !== null) {
        priceFilter.lte = priceMax;
      }
      whereClause.pricePerDay = priceFilter;
    }

    // Filtre par disponibilité (si dates spécifiées)
    if (availableFrom && availableTo) {
      // Matériels qui n'ont pas de location active pendant la période demandée
      whereClause.locations = {
        none: {
          AND: [
            {
              status: {
                in: ['CONFIRMED', 'ACTIVE']
              }
            },
            {
              OR: [
                {
                  AND: [
                    { startDate: { lte: new Date(availableTo) } },
                    { endDate: { gte: new Date(availableFrom) } }
                  ]
                }
              ]
            }
          ]
        }
      };
    }

    // Construction de l'ordre de tri
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'price':
        orderBy.pricePerDay = sortOrder;
        break;
      case 'type':
        orderBy.type = sortOrder;
        break;
      case 'created':
        orderBy.createdAt = sortOrder;
        break;
      case 'updated':
        orderBy.updatedAt = sortOrder;
        break;
      default:
        orderBy.name = 'asc';
    }

    const startTime = Date.now();

    // Exécution de la recherche avec informations étendues
    const [materiels, totalCount] = await Promise.all([
      prisma.materiel.findMany({
        where: whereClause,
        include: {
          locations: {
            where: {
              status: {
                in: ['CONFIRMED', 'ACTIVE']
              }
            },
            orderBy: {
              endDate: 'desc'
            },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
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
      prisma.materiel.count({ where: whereClause })
    ]);

    // Calcul des facettes pour l'interface utilisateur
    const [typeFacets, statusFacets, priceRangeFacets] = await Promise.all([
      // Facettes par type
      prisma.materiel.groupBy({
        by: ['type'],
        where: whereClause,
        _count: {
          type: true
        }
      }),
      // Facettes par statut
      prisma.materiel.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
          status: true
        }
      }),
      // Facettes par gamme de prix - requête simplifiée
      prisma.materiel.findMany({
        where: whereClause,
        select: {
          pricePerDay: true
        }
      }).then(materiels => {
        const ranges = {
          '0-100': 0,
          '100-500': 0,
          '500-1000': 0,
          '1000+': 0
        };
        
        materiels.forEach(m => {
          const price = Number(m.pricePerDay);
          if (price < 100) ranges['0-100']++;
          else if (price < 500) ranges['100-500']++;
          else if (price < 1000) ranges['500-1000']++;
          else ranges['1000+']++;
        });
        
        return Object.entries(ranges).map(([range, count]) => ({ range, count }));
      })
    ]);

    // Transformation des résultats
    const results: MaterialSearchResult[] = materiels.map(materiel => {
      const currentLocation = materiel.locations[0] || null;
      const isAvailable = materiel.status === 'AVAILABLE' && !currentLocation;
      
      // Calcul du score de pertinence basé sur la recherche textuelle
      let relevanceScore = 1.0;
      if (query) {
        const nameMatch = materiel.name.toLowerCase().includes(query.toLowerCase());
        const descMatch = materiel.description?.toLowerCase().includes(query.toLowerCase());
        relevanceScore = nameMatch ? 1.0 : (descMatch ? 0.8 : 0.5);
      }

      // Highlights pour la recherche textuelle
      const highlights = [];
      if (query) {
        const queryLower = query.toLowerCase();
        if (materiel.name.toLowerCase().includes(queryLower)) {
          highlights.push({
            field: 'name',
            value: materiel.name,
            matchedText: query
          });
        }
        if (materiel.description?.toLowerCase().includes(queryLower)) {
          highlights.push({
            field: 'description',
            value: materiel.description,
            matchedText: query
          });
        }
      }

      return {
        id: materiel.id,
        relevanceScore,
        highlights,
        item: {
          ...materiel,
          availability: {
            isAvailable,
            nextAvailableDate: currentLocation?.endDate.toISOString(),
            currentLocation: currentLocation ? {
              id: currentLocation.id,
              endDate: currentLocation.endDate.toISOString(),
              user: {
                name: currentLocation.user.name
              }
            } : undefined
          }
        }
      };
    });

    const searchTime = Date.now() - startTime;

    // Construction de la réponse
    const response: MaterialSearchResponse = {
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
          types: typeFacets.map(f => ({ type: f.type, count: f._count.type })),
          statuses: statusFacets.map(f => ({ status: f.status, count: f._count.status })),
          priceRanges: priceRangeFacets.map(f => ({ range: f.range, count: f.count }))
        },
        suggestions: query ? await generateSearchSuggestions(query) : [],
        searchTime
      },
      message: `${totalCount} matériel(s) trouvé(s)`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la recherche de matériels:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur lors de la recherche de matériels' 
      },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour générer des suggestions de recherche
async function generateSearchSuggestions(query: string): Promise<string[]> {
  try {
    const suggestions = await prisma.materiel.findMany({
      where: {
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
      },
      select: {
        name: true
      },
      take: 5
    });

    return suggestions.map(s => s.name);
  } catch {
    return [];
  }
}
