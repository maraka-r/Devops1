import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ClientAnalysisReportResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const clientId = searchParams.get('clientId');
    
    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    
    // Build location filters
    const locationFilters: { 
      startDate?: { gte?: Date; lte?: Date };
      userId?: string;
    } = {
      ...(Object.keys(dateFilter).length > 0 && { startDate: dateFilter }),
      ...(clientId && { userId: clientId })
    };
    
    // Get all locations with user and material data
    const locations = await prisma.location.findMany({
      where: locationFilters,
      include: {
        user: true,
        materiel: true
      }
    });
    
    // Get all users for client analysis
    const allUsers = await prisma.user.findMany();
    
    // Get unique clients from locations
    const uniqueClientIds = Array.from(new Set(locations.map(loc => loc.userId)));
    const activeClients = allUsers.filter(u => uniqueClientIds.includes(u.id));
    
    // Calculate client metrics
    const clientAnalysisDetails = activeClients.map(client => {
      const clientLocations = locations.filter(loc => loc.userId === client.id);
      const totalOrders = clientLocations.length;
      const totalRevenue = clientLocations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate rental frequency (orders per month)
      const firstOrder = clientLocations.length > 0 ? 
        new Date(Math.min(...clientLocations.map(loc => new Date(loc.startDate).getTime()))) : new Date();
      const lastOrder = clientLocations.length > 0 ? 
        new Date(Math.max(...clientLocations.map(loc => new Date(loc.startDate).getTime()))) : new Date();
      const monthsDiff = Math.max(1, (lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const rentalFrequency = totalOrders / monthsDiff;
      
      // Calculate retention (simplified: has orders in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrders = clientLocations.filter(loc => new Date(loc.startDate) >= thirtyDaysAgo);
      const retentionScore = recentOrders.length > 0 ? 100 : 0;
      
      // Determine client segment based on revenue and frequency
      let clientSegment = 'bronze';
      if (totalRevenue > 10000 && rentalFrequency > 2) {
        clientSegment = 'gold';
      } else if (totalRevenue > 5000 || rentalFrequency > 1) {
        clientSegment = 'silver';
      }
      
      // Get preferred materials (most frequently rented)
      const materialCounts = clientLocations.reduce((acc, loc) => {
        const materialName = loc.materiel.name;
        acc[materialName] = (acc[materialName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const preferredMaterials = Object.entries(materialCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name);
      
      return {
        clientId: client.id,
        clientName: client.name,
        email: client.email,
        segment: clientSegment,
        status: client.status,
        registrationDate: client.createdAt,
        metrics: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          lastOrderDate: lastOrder,
          daysSinceLastOrder: Math.ceil((new Date().getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)),
          lifetimeValue: totalRevenue // Simplified LTV
        },
        preferences: {
          preferredMaterials,
          averageRentalDuration: clientLocations.length > 0 ? 
            clientLocations.reduce((sum, loc) => {
              const duration = (new Date(loc.endDate).getTime() - new Date(loc.startDate).getTime()) / (1000 * 60 * 60 * 24);
              return sum + duration;
            }, 0) / clientLocations.length : 0,
          seasonality: 'N/A' // TODO: Calculate seasonal patterns
        },
        activity: {
          firstOrder: firstOrder.toISOString(),
          lastOrder: lastOrder.toISOString(),
          totalDays: Math.ceil((lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24)),
          isActive: recentOrders.length > 0
        },
        behavior: {
          preferredCategories: Array.from(new Set(clientLocations.map(loc => loc.materiel.type))),
          averageRentalDuration: clientLocations.length > 0 ? 
            clientLocations.reduce((sum, loc) => {
              const duration = (new Date(loc.endDate).getTime() - new Date(loc.startDate).getTime()) / (1000 * 60 * 60 * 24);
              return sum + duration;
            }, 0) / clientLocations.length : 0,
          seasonality: 'N/A', // TODO: Calculate seasonal patterns
          paymentReliability: 'excellent' as const // TODO: Analyze payment history
        },
        risk: {
          churnRisk: (retentionScore < 50 ? 'high' : 'low') as 'high' | 'medium' | 'low',
          factors: retentionScore < 50 ? ['Faible activité récente', 'Baisse de fréquence'] : ['Client actif', 'Historique stable']
        }
      };
    }).sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue);
    
    // Calculate client segments
    const segmentBreakdown = clientAnalysisDetails.reduce((acc, client) => {
      const segment = client.segment;
      if (!acc[segment]) {
        acc[segment] = {
          segment,
          description: `Clients ${segment}`,
          clientCount: 0,
          percentage: 0,
          averageRevenue: 0,
          averageOrders: 0,
          characteristics: [] as string[]
        };
      }
      
      acc[segment].clientCount += 1;
      acc[segment].averageRevenue += client.metrics.totalRevenue;
      acc[segment].averageOrders += client.metrics.totalOrders;
      
      return acc;
    }, {} as Record<string, {
      segment: string;
      description: string;
      clientCount: number;
      percentage: number;
      averageRevenue: number;
      averageOrders: number;
      characteristics: string[];
    }>);
    
    // Calculate segment averages and percentages
    const totalClients = clientAnalysisDetails.length;
    Object.values(segmentBreakdown).forEach(segment => {
      segment.percentage = totalClients > 0 ? (segment.clientCount / totalClients) * 100 : 0;
      segment.averageRevenue = segment.clientCount > 0 ? segment.averageRevenue / segment.clientCount : 0;
      segment.averageOrders = segment.clientCount > 0 ? segment.averageOrders / segment.clientCount : 0;
      
      // Add characteristics based on segment
      if (segment.segment === 'gold') {
        segment.characteristics = ['Haute valeur', 'Fréquence élevée', 'Fidèle'];
      } else if (segment.segment === 'silver') {
        segment.characteristics = ['Valeur moyenne', 'Fréquence modérée', 'Potentiel'];
      } else {
        segment.characteristics = ['Nouveau client', 'Faible fréquence', 'À développer'];
      }
    });
    
    // Calculate period trends
    const periodBreakdownMap: Record<string, {
      period: string;
      date: Date;
      totalClients: number;
      activeClients: number;
      newClients: number;
      churnedClients: number;
      revenue: number;
      retentionRate: number;
      averageRevenue: number;
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
          totalClients: 0,
          activeClients: 0,
          newClients: 0,
          churnedClients: 0,
          revenue: 0,
          retentionRate: 0,
          averageRevenue: 0
        };
      }
      
      periodBreakdownMap[periodKey].revenue += Number(location.totalPrice);
    });
    
    // Calculate client trends
    const clientTrends = Object.values(periodBreakdownMap).map(item => ({
      ...item,
      totalClients: activeClients.length, // Simplified
      activeClients: activeClients.length, // Simplified
      newClients: 0, // TODO: Calculate new clients per period
      churnedClients: 0, // TODO: Calculate churned clients per period
      retentionRate: 80, // TODO: Calculate actual retention rate
      averageRevenue: item.revenue / Math.max(1, activeClients.length)
    }));
    
    // Calculate overall metrics
    const totalRevenue = locations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
    const averageLifetimeValue = totalClients > 0 ? totalRevenue / totalClients : 0;
    
    // Calculate new clients (simplified: clients with first order in period)
    const newClients = 0; // TODO: Implement proper new client calculation
    
    // Calculate churn rate (simplified)
    const churnRate = 0; // TODO: Implement proper churn calculation
    
    // Calculate retention rate (simplified)
    const retentionRate = 80; // TODO: Implement proper retention calculation
    
    // Determine period dates
    const periodStart = startDate ? new Date(startDate) : new Date();
    const periodEnd = endDate ? new Date(endDate) : new Date();
    
    const response: ClientAnalysisReportResponse = {
      success: true,
      message: 'Rapport d\'analyse des clients généré avec succès',
      generatedAt: new Date(),
      data: {
        period: {
          start: periodStart,
          end: periodEnd
        },
        summary: {
          totalClients: totalClients,
          activeClients: activeClients.length,
          newClients,
          churnRate,
          averageLifetimeValue,
          retentionRate
        },
        segments: Object.values(segmentBreakdown),
        clients: clientAnalysisDetails,
        trends: clientTrends
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error generating client analysis report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la génération du rapport d\'analyse des clients' 
      },
      { status: 500 }
    );
  }
}
