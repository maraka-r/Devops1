import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PerformanceReportResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    
    // Build location filters
    const locationFilters: { startDate?: { gte?: Date; lte?: Date } } = {
      ...(Object.keys(dateFilter).length > 0 && { startDate: dateFilter })
    };
    
    // Get all locations with related data
    const locations = await prisma.location.findMany({
      where: locationFilters,
      include: {
        user: true,
        materiel: true
      }
    });
    
    // Get all materials and users for additional calculations
    const allMaterials = await prisma.materiel.findMany();
    
    // Calculate overall metrics
    const totalRevenue = locations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
    const totalLocations = locations.length;
    const averageOrderValue = totalLocations > 0 ? totalRevenue / totalLocations : 0;
    
    // Calculate utilization rate (active locations vs total materials)
    const activeMaterials = Array.from(new Set(locations.map(loc => loc.materielId))).length;
    const utilizationRate = allMaterials.length > 0 ? (activeMaterials / allMaterials.length) * 100 : 0;
    
    // Calculate customer satisfaction (simplified - based on completion rate)
    const completedLocations = locations.filter(loc => loc.status === 'COMPLETED').length;
    const customerSatisfaction = totalLocations > 0 ? (completedLocations / totalLocations) * 100 : 0;
    
    // Calculate period breakdown for trends
    const periodBreakdownMap: Record<string, {
      period: string;
      date: Date;
      revenue: number;
      orders: number;
      averageOrderValue: number;
      utilizationRate: number;
      customerSatisfaction: number;
    }> = {};
    
    locations.forEach(location => {
      const date = new Date(location.startDate);
      let periodKey: string;
      let periodDate: Date;
      
      switch (period) {
        case 'day':
          periodKey = date.toISOString().split('T')[0];
          periodDate = new Date(date.toISOString().split('T')[0]);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          periodDate = weekStart;
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          periodDate = new Date(date.getFullYear(), date.getMonth(), 1);
          break;
        case 'year':
          periodKey = String(date.getFullYear());
          periodDate = new Date(date.getFullYear(), 0, 1);
          break;
        default:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          periodDate = new Date(date.getFullYear(), date.getMonth(), 1);
      }
      
      if (!periodBreakdownMap[periodKey]) {
        periodBreakdownMap[periodKey] = {
          period: periodKey,
          date: periodDate,
          revenue: 0,
          orders: 0,
          averageOrderValue: 0,
          utilizationRate: 0,
          customerSatisfaction: 0
        };
      }
      
      periodBreakdownMap[periodKey].revenue += Number(location.totalPrice);
      periodBreakdownMap[periodKey].orders += 1;
    });
    
    // Calculate period metrics
    const trends = Object.values(periodBreakdownMap).map(item => {
      const periodLocations = locations.filter(loc => {
        const locDate = new Date(loc.startDate);
        return locDate >= item.date && locDate < new Date(item.date.getTime() + (30 * 24 * 60 * 60 * 1000)); // Rough period check
      });
      
      const periodCompleted = periodLocations.filter(loc => loc.status === 'COMPLETED').length;
      const periodActiveMaterials = Array.from(new Set(periodLocations.map(loc => loc.materielId))).length;
      
      return {
        ...item,
        averageOrderValue: item.orders > 0 ? item.revenue / item.orders : 0,
        utilizationRate: allMaterials.length > 0 ? (periodActiveMaterials / allMaterials.length) * 100 : 0,
        customerSatisfaction: periodLocations.length > 0 ? (periodCompleted / periodLocations.length) * 100 : 0
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate growth metrics
    const revenueGrowth = trends.length > 1 ? 
      ((trends[trends.length - 1].revenue - trends[0].revenue) / Math.max(trends[0].revenue, 1)) * 100 : 0;
    
    const orderGrowth = trends.length > 1 ? 
      ((trends[trends.length - 1].orders - trends[0].orders) / Math.max(trends[0].orders, 1)) * 100 : 0;
    
    // Calculate key performance indicators organized by category
    const financialKPIs = [
      {
        name: 'Chiffre d\'affaires',
        value: totalRevenue,
        target: totalRevenue * 1.2,
        previous: totalRevenue * 0.9, // Simplified previous period
        unit: 'EUR',
        trend: revenueGrowth > 0 ? 'up' as const : 'down' as const,
        status: revenueGrowth > 10 ? 'excellent' as const : revenueGrowth > 0 ? 'good' as const : 'warning' as const
      },
      {
        name: 'Panier moyen',
        value: averageOrderValue,
        target: averageOrderValue * 1.1,
        previous: averageOrderValue * 0.95, // Simplified previous period
        unit: 'EUR',
        trend: 'stable' as const,
        status: 'good' as const
      }
    ];
    
    const operationalKPIs = [
      {
        name: 'Nombre de commandes',
        value: totalLocations,
        target: totalLocations * 1.15,
        previous: Math.floor(totalLocations * 0.85), // Simplified previous period
        unit: 'commandes',
        trend: orderGrowth > 0 ? 'up' as const : 'down' as const,
        status: orderGrowth > 15 ? 'excellent' as const : orderGrowth > 0 ? 'good' as const : 'warning' as const
      },
      {
        name: 'Taux d\'utilisation',
        value: utilizationRate,
        target: 85,
        previous: utilizationRate * 0.9, // Simplified previous period
        unit: '%',
        trend: 'stable' as const,
        status: utilizationRate > 80 ? 'excellent' as const : utilizationRate > 60 ? 'good' as const : 'warning' as const
      }
    ];
    
    const customerKPIs = [
      {
        name: 'Satisfaction client',
        value: customerSatisfaction,
        target: 95,
        previous: customerSatisfaction * 0.95, // Simplified previous period
        unit: '%',
        trend: 'stable' as const,
        status: customerSatisfaction > 90 ? 'excellent' as const : customerSatisfaction > 75 ? 'good' as const : 'warning' as const
      }
    ];
    
    const kpis = {
      financial: financialKPIs,
      operational: operationalKPIs,
      customer: customerKPIs
    };
    
    // Determine period dates
    const periodStart = startDate ? new Date(startDate) : new Date();
    const periodEnd = endDate ? new Date(endDate) : new Date();
    
    // Generate sample goals and insights (TODO: Implement proper logic)
    const goals = [
      {
        name: 'Augmenter le chiffre d\'affaires',
        target: totalRevenue * 1.2,
        current: totalRevenue,
        progress: 85,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        status: 'on-track' as const
      }
    ];
    
    const insights = [
      {
        type: 'opportunity' as const,
        category: 'revenue',
        title: 'Potentiel d\'augmentation des revenus',
        description: 'Le taux d\'utilisation actuel suggère des opportunités d\'optimisation',
        impact: 'high' as const,
        priority: 'high' as const,
        confidence: 85, // Confidence percentage
        actionable: true
      }
    ];
    
    const recommendations = [
      {
        title: 'Optimiser l\'utilisation des matériels',
        description: 'Améliorer la planification pour augmenter le taux d\'utilisation',
        priority: 'high' as const,
        impact: 'high' as const,
        effort: 'medium' as const,
        category: 'operational',
        timeline: '1-3 mois', // Expected timeline
        actions: ['Analyser les créneaux libres', 'Optimiser les plannings']
      }
    ];
    
    const response: PerformanceReportResponse = {
      success: true,
      message: 'Rapport de performance généré avec succès',
      generatedAt: new Date(),
      data: {
        period: {
          start: periodStart,
          end: periodEnd
        },
        overview: {
          totalRevenue,
          totalOrders: totalLocations,
          activeClients: Array.from(new Set(locations.map(loc => loc.userId))).length,
          activeMaterials,
          utilizationRate,
          customerSatisfaction
        },
        kpis,
        goals,
        insights,
        recommendations
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error generating performance report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la génération du rapport de performance' 
      },
      { status: 500 }
    );
  }
}
