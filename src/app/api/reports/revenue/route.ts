/**
 * Endpoint de rapport de revenus - GET /api/reports/revenue
 * Génère des rapports détaillés sur les revenus de location de matériel
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RevenueReportResponse } from '@/types';
import { LocationStatus } from '@/generated/prisma';

/**
 * GET /api/reports/revenue - Rapport des revenus
 * 
 * Paramètres de requête:
 * - period: 'day' | 'week' | 'month' | 'quarter' | 'year' (défaut: month)
 * - startDate: Date de début (format ISO)
 * - endDate: Date de fin (format ISO)
 * - clientIds: IDs des clients (séparés par virgule)
 * - materielIds: IDs du matériel (séparés par virgule)
 * - categories: Catégories de matériel (séparées par virgule)
 * - includeInactive: Inclure les clients/matériel inactifs (défaut: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse des paramètres avec validation
    const period = (searchParams.get('period') as 'day' | 'week' | 'month' | 'quarter' | 'year') || 'month';
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    console.log(`[API] Rapport revenus - Période: ${period}, Inclure inactifs: ${includeInactive}`);
    
    // Parse des dates
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getTime());
    
    if (searchParams.get('startDate') && searchParams.get('endDate')) {
      startDate = new Date(searchParams.get('startDate')!);
      endDate = new Date(searchParams.get('endDate')!);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Format de date invalide',
          details: 'Utilisez le format ISO (YYYY-MM-DD)'
        }, { status: 400 });
      }
      
      if (startDate >= endDate) {
        return NextResponse.json({
          success: false,
          error: 'Période invalide',
          details: 'La date de début doit être antérieure à la date de fin'
        }, { status: 400 });
      }
    } else {
      // Calculer la période par défaut
      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }
    
    // Parse des filtres optionnels
    const clientIds = searchParams.get('clientIds')?.split(',').filter(Boolean);
    const materielIds = searchParams.get('materielIds')?.split(',').filter(Boolean);
    // const categories = searchParams.get('categories')?.split(',').filter(Boolean); // TODO: Implémenter filtrage par catégories
    
    console.log(`[API] Génération rapport revenus - Période: ${startDate.toISOString()} à ${endDate.toISOString()}`);
    
    // Construction des filtres Prisma simplifiés
    const baseFilter = {
      startDate: { gte: startDate },
      endDate: { lte: endDate }
    };
    
    if (!includeInactive) {
      Object.assign(baseFilter, {
        status: { in: [LocationStatus.ACTIVE, LocationStatus.COMPLETED] }
      });
    }
    
    if (clientIds && clientIds.length > 0) {
      Object.assign(baseFilter, { userId: { in: clientIds } });
    }
    
    if (materielIds && materielIds.length > 0) {
      Object.assign(baseFilter, { materielId: { in: materielIds } });
    }
    
    // Récupération des données simplifiée - utilisons totalPrice directement
    const [locations, previousPeriodLocations] = await Promise.all([
      // Locations de la période actuelle
      prisma.location.findMany({
        where: baseFilter,
        include: {
          materiel: {
            select: {
              id: true,
              name: true,
              type: true,
              pricePerDay: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          }
        },
        orderBy: { startDate: 'desc' }
      }),
      
      // Locations de la période précédente pour comparaison
      prisma.location.findMany({
        where: {
          ...baseFilter,
          startDate: { 
            gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
            lt: startDate
          },
          endDate: { 
            lte: startDate
          }
        }
      })
    ]);
    
    console.log(`[API] ${locations.length} locations trouvées pour la période`);
    
    // Calcul des métriques de revenus basé sur totalPrice des locations
    const totalRevenue = locations.reduce((sum, location) => {
      return sum + Number(location.totalPrice);
    }, 0);
    
    const totalLocationsRevenue = totalRevenue; // Identique car on utilise totalPrice
    
    // Simuler des pénalités (5% du total)
    const totalPenalties = totalRevenue * 0.05;
    
    // Calculer les taxes (TVA 20%)
    const totalTaxes = totalRevenue * 0.20;
    
    const netRevenue = totalRevenue - totalTaxes;
    
    // Calcul de la période précédente pour comparaison
    const previousRevenue = previousPeriodLocations.reduce((sum, location) => {
      return sum + Number(location.totalPrice);
    }, 0);
    
    const growthPercentage = previousRevenue > 0 ? 
      ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    
    const trend: 'up' | 'down' | 'stable' = growthPercentage > 5 ? 'up' : growthPercentage < -5 ? 'down' : 'stable';
    
    // Breakdown par matériel
    const materialRevenueMap = new Map();
    locations.forEach(location => {
      const materialId = location.materiel.id;
      const materialName = location.materiel.name;
      const category = location.materiel.type;
      const revenue = Number(location.totalPrice);
      
      if (!materialRevenueMap.has(materialId)) {
        materialRevenueMap.set(materialId, {
          materielId: materialId,
          materielName: materialName,
          category: category,
          revenue: 0,
          rentals: 0,
          totalDays: 0
        });
      }
      
      const material = materialRevenueMap.get(materialId);
      material.revenue += revenue;
      material.rentals += 1;
      
      const days = Math.max(1, Math.ceil((location.endDate.getTime() - location.startDate.getTime()) / (1000 * 60 * 60 * 24)));
      material.totalDays += days;
    });
    
    const byMaterial = Array.from(materialRevenueMap.values()).map(material => ({
      ...material,
      percentage: totalRevenue > 0 ? (material.revenue / totalRevenue) * 100 : 0,
      averageRentalValue: material.rentals > 0 ? material.revenue / material.rentals : 0,
      utilizationRate: material.totalDays > 0 ? (material.totalDays / (locations.length || 1)) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
    
    // Breakdown par client
    const clientRevenueMap = new Map();
    locations.forEach(location => {
      const clientId = location.user.id;
      const clientName = location.user.name;
      const company = location.user.company;
      const revenue = Number(location.totalPrice);
      
      if (!clientRevenueMap.has(clientId)) {
        clientRevenueMap.set(clientId, {
          clientId: clientId,
          clientName: clientName,
          company: company,
          revenue: 0,
          orders: 0,
          lastOrder: location.startDate
        });
      }
      
      const client = clientRevenueMap.get(clientId);
      client.revenue += revenue;
      client.orders += 1;
      
      if (location.startDate > client.lastOrder) {
        client.lastOrder = location.startDate;
      }
    });
    
    const byClient = Array.from(clientRevenueMap.values()).map(client => ({
      ...client,
      percentage: totalRevenue > 0 ? (client.revenue / totalRevenue) * 100 : 0,
      averageOrderValue: client.orders > 0 ? client.revenue / client.orders : 0
    })).sort((a, b) => b.revenue - a.revenue);
    
    // Breakdown par période
    const periodBreakdownMap = new Map();
    locations.forEach(location => {
      const periodKey = period === 'day' || period === 'week' ? 
        location.startDate.toISOString().split('T')[0] :
        `${location.startDate.getFullYear()}-${(location.startDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const revenue = Number(location.totalPrice);
      
      if (!periodBreakdownMap.has(periodKey)) {
        periodBreakdownMap.set(periodKey, {
          period: periodKey,
          date: location.startDate,
          revenue: 0,
          orders: 0
        });
      }
      
      const periodData = periodBreakdownMap.get(periodKey);
      periodData.revenue += revenue;
      periodData.orders += 1;
    });
    
    const byPeriod = Array.from(periodBreakdownMap.values()).map(periodData => ({
      ...periodData,
      averageOrderValue: periodData.orders > 0 ? periodData.revenue / periodData.orders : 0,
      growth: 0 // TODO: Calculer la croissance vs période précédente
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calcul des métriques
    const totalOrders = locations.length;
    const activeClients = new Set(locations.map(l => l.user.id)).size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Simuler un taux de conversion (normalement basé sur les visiteurs/prospects)
    const conversionRate = 15; // 15% simulé
    
    // Construction de la réponse
    const revenueReport = {
      period: {
        start: startDate,
        end: endDate,
        type: period
      },
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        locations: Math.round(totalLocationsRevenue * 100) / 100,
        penalties: Math.round(totalPenalties * 100) / 100,
        taxes: Math.round(totalTaxes * 100) / 100,
        net: Math.round(netRevenue * 100) / 100
      },
      growth: {
        percentage: Math.round(growthPercentage * 100) / 100,
        previousPeriod: Math.round(previousRevenue * 100) / 100,
        trend
      },
      breakdown: {
        byMaterial: byMaterial.slice(0, 10), // Top 10
        byClient: byClient.slice(0, 10), // Top 10
        byPeriod
      },
      metrics: {
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        totalOrders,
        activeClients,
        conversionRate
      }
    };
    
    const response: RevenueReportResponse = {
      success: true,
      data: revenueReport,
      message: `Rapport de revenus généré avec succès pour la période ${period}`,
      generatedAt: new Date()
    };
    
    console.log(`[API] Rapport revenus généré - Total: ${totalRevenue}€, Croissance: ${growthPercentage}%`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] Erreur lors de la génération du rapport de revenus:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la génération du rapport de revenus',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
