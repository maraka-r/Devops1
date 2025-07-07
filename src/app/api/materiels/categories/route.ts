// API Route pour récupérer les catégories de matériels
// GET /api/materiels/categories - Types/catégories de matériel disponibles

import { NextResponse } from 'next/server';
import { MaterielType } from '@/types';
import prisma from '@/lib/db';

/**
 * GET /api/materiels/categories
 * Récupère les types/catégories de matériel avec statistiques
 * Accessible à tous
 */
export async function GET() {
  try {
    // Récupérer toutes les catégories avec le nombre de matériels par catégorie
    const categoriesWithCount = await prisma.materiel.groupBy({
      by: ['type'],
      _count: {
        id: true
      },
      _avg: {
        pricePerDay: true
      },
      where: {
        status: 'AVAILABLE'
      }
    });

    // Définir les informations détaillées pour chaque catégorie
    const categoryDetails: Record<string, { 
      name: string; 
      description: string; 
      icon?: string;
      typical_uses: string[];
    }> = {
      [MaterielType.GRUE_MOBILE]: {
        name: 'Grue Mobile',
        description: 'Grues mobiles pour levage et manutention',
        icon: '🏗️',
        typical_uses: ['Levage de charges lourdes', 'Construction', 'Manutention industrielle']
      },
      [MaterielType.GRUE_TOUR]: {
        name: 'Grue Tour',
        description: 'Grues tours pour chantiers de construction',
        icon: '🏗️',
        typical_uses: ['Construction de bâtiments', 'Grands chantiers', 'Levage en hauteur']
      },
      [MaterielType.TELESCOPIQUE]: {
        name: 'Télescopique',
        description: 'Chargeurs télescopiques polyvalents',
        icon: '🚜',
        typical_uses: ['Manutention', 'Chargement', 'Travaux agricoles', 'Construction']
      },
      [MaterielType.NACELLE_CISEAUX]: {
        name: 'Nacelle Ciseaux',
        description: 'Nacelles élévatrices à ciseaux',
        icon: '📐',
        typical_uses: ['Travaux en hauteur', 'Maintenance', 'Peinture', 'Installation']
      },
      [MaterielType.NACELLE_ARTICULEE]: {
        name: 'Nacelle Articulée',
        description: 'Nacelles élévatrices articulées',
        icon: '🔧',
        typical_uses: ['Accès difficile', 'Contournement d\'obstacles', 'Travaux de précision']
      },
      [MaterielType.NACELLE_TELESCOPIQUE]: {
        name: 'Nacelle Télescopique',
        description: 'Nacelles élévatrices télescopiques',
        icon: '📏',
        typical_uses: ['Grande hauteur', 'Portée importante', 'Travaux linéaires']
      },
      [MaterielType.COMPACTEUR]: {
        name: 'Compacteur',
        description: 'Compacteurs pour travaux de terrassement',
        icon: '🛤️',
        typical_uses: ['Compactage de sols', 'Terrassement', 'Voirie', 'Aménagement']
      },
      [MaterielType.PELLETEUSE]: {
        name: 'Pelleteuse',
        description: 'Pelleteuses pour excavation et terrassement',
        icon: '🚛',
        typical_uses: ['Excavation', 'Terrassement', 'Démolition', 'Déblayage']
      },
      [MaterielType.AUTRE]: {
        name: 'Autre',
        description: 'Autres types de matériel BTP',
        icon: '⚙️',
        typical_uses: ['Divers travaux BTP', 'Matériel spécialisé']
      }
    };

    // Construire la réponse avec les statistiques
    const categories = categoriesWithCount.map(category => ({
      type: category.type,
      ...categoryDetails[category.type],
      stats: {
        available_count: category._count.id,
        average_price_per_day: category._avg.pricePerDay ? Math.round(Number(category._avg.pricePerDay) * 100) / 100 : 0
      }
    }));

    // Ajouter les catégories sans matériel avec count = 0
    const existingTypes = new Set(categoriesWithCount.map(c => c.type));
    const allTypes = Object.values(MaterielType);
    
    const emptyCategoriesInfo = allTypes
      .filter(type => !existingTypes.has(type))
      .map(type => ({
        type,
        ...categoryDetails[type],
        stats: {
          available_count: 0,
          average_price_per_day: 0
        }
      }));

    const allCategories = [...categories, ...emptyCategoriesInfo]
      .sort((a, b) => a.name.localeCompare(b.name));

    // Statistiques globales
    const totalAvailable = categories.reduce((sum, cat) => sum + cat.stats.available_count, 0);
    const globalAveragePrice = categories.length > 0 
      ? categories.reduce((sum, cat) => sum + cat.stats.average_price_per_day, 0) / categories.length 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        categories: allCategories,
        summary: {
          total_categories: allTypes.length,
          categories_with_available_items: categories.length,
          total_available_items: totalAvailable,
          global_average_price_per_day: Math.round(globalAveragePrice * 100) / 100
        }
      },
      message: `${allTypes.length} catégories de matériel, ${totalAvailable} matériels disponibles`
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    );
  }
}
