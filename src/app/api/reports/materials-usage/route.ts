import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MaterialUsageReportResponse, MaterielType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const materialId = searchParams.get('materialId');
    const category = searchParams.get('category');
    
    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    
    // Build base filters for locations
    const locationFilters: { startDate?: { gte?: Date; lte?: Date } } = {
      ...(Object.keys(dateFilter).length > 0 && { startDate: dateFilter })
    };
    
    // Get all locations with materials
    const locations = await prisma.location.findMany({
      where: locationFilters,
      include: {
        materiel: true,
        user: true
      }
    });
    
    // Build material filters
    const materialFilters: { id?: string; type?: MaterielType } = {};
    if (materialId) materialFilters.id = materialId;
    if (category) materialFilters.type = category as MaterielType;
    
    // Get all materials for filtering
    const allMaterials = await prisma.materiel.findMany({
      where: materialFilters
    });
    
    // Filter locations by material criteria
    const filteredLocations = locations.filter(loc => {
      if (materialId && loc.materielId !== materialId) return false;
      if (category) {
        const material = allMaterials.find(m => m.id === loc.materielId);
        if (!material || material.type !== category) return false;
      }
      return true;
    });
    
    // Calculate total usage metrics
    const totalLocations = filteredLocations.length;
    const totalRevenue = filteredLocations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
    
    // Get unique materials from locations
    const uniqueMaterialIds = Array.from(new Set(filteredLocations.map(loc => loc.materielId)));
    const uniqueMaterials = allMaterials.filter(m => uniqueMaterialIds.includes(m.id));
    
    // Calculate usage details by material
    const materialDetails = uniqueMaterials.map(material => {
      const materialLocations = filteredLocations.filter(loc => loc.materielId === material.id);
      const totalRentals = materialLocations.length;
      const totalDays = materialLocations.reduce((sum, loc) => {
        const duration = (new Date(loc.endDate).getTime() - new Date(loc.startDate).getTime()) / (1000 * 60 * 60 * 24);
        return sum + duration;
      }, 0);
      const revenue = materialLocations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
      const averageRentalDuration = totalRentals > 0 ? totalDays / totalRentals : 0;
      const utilizationRate = totalRentals > 0 ? (totalRentals / totalLocations) * 100 : 0;
      
      return {
        materielId: material.id,
        materielName: material.name,
        category: material.type,
        status: material.status,
        metrics: {
          totalRentals,
          totalDays,
          utilizationRate,
          revenue,
          averageRentalDuration,
          maintenanceDays: 0 // TODO: Calculate from maintenance records
        },
        performance: {
          bestMonth: 'N/A', // TODO: Calculate from period data
          worstMonth: 'N/A', // TODO: Calculate from period data
          trend: 'stable' as const,
          seasonality: 0 // TODO: Calculate seasonality index
        }
      };
    }).sort((a, b) => b.metrics.totalRentals - a.metrics.totalRentals);
    
    // Calculate category breakdown
    const categoryBreakdownMap: Record<string, {
      category: string;
      totalMaterials: number;
      activeMaterials: number;
      utilizationRate: number;
      revenue: number;
      percentage: number;
      popularItems: string[];
    }> = {};
    
    uniqueMaterials.forEach(material => {
      const category = material.type;
      if (!categoryBreakdownMap[category]) {
        categoryBreakdownMap[category] = {
          category,
          totalMaterials: 0,
          activeMaterials: 0,
          utilizationRate: 0,
          revenue: 0,
          percentage: 0,
          popularItems: []
        };
      }
      
      const materialLocations = filteredLocations.filter(loc => loc.materielId === material.id);
      categoryBreakdownMap[category].totalMaterials += 1;
      if (material.status === 'AVAILABLE') {
        categoryBreakdownMap[category].activeMaterials += 1;
      }
      categoryBreakdownMap[category].revenue += materialLocations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
      
      // Add to popular items if has significant usage
      if (materialLocations.length > 0) {
        categoryBreakdownMap[category].popularItems.push(material.name);
      }
    });
    
    // Calculate percentages and utilization rates for categories
    Object.values(categoryBreakdownMap).forEach(category => {
      category.percentage = totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0;
      category.utilizationRate = category.totalMaterials > 0 ? (category.activeMaterials / category.totalMaterials) * 100 : 0;
      // Keep only top 3 popular items
      category.popularItems = category.popularItems.slice(0, 3);
    });
    
    // Calculate period breakdown for trends
    const periodBreakdownMap: Record<string, {
      period: string;
      date: Date;
      totalRentals: number;
      utilizationRate: number;
      revenue: number;
      activeMaterials: number;
    }> = {};
    
    filteredLocations.forEach(location => {
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
          totalRentals: 0,
          utilizationRate: 0,
          revenue: 0,
          activeMaterials: 0
        };
      }
      
      periodBreakdownMap[periodKey].totalRentals += 1;
      periodBreakdownMap[periodKey].revenue += Number(location.totalPrice);
    });
    
    // Calculate utilization rates and active materials for periods
    const periodBreakdownArray = Object.values(periodBreakdownMap).map(item => ({
      ...item,
      utilizationRate: item.totalRentals > 0 ? (item.totalRentals / totalLocations) * 100 : 0,
      activeMaterials: uniqueMaterials.filter(m => m.status === 'AVAILABLE').length
    }));
    
    // Calculate overall metrics
    const totalRentalDays = filteredLocations.reduce((sum, loc) => {
      const duration = (new Date(loc.endDate).getTime() - new Date(loc.startDate).getTime()) / (1000 * 60 * 60 * 24);
      return sum + duration;
    }, 0);
    
    const averageUtilization = materialDetails.length > 0 ? 
      materialDetails.reduce((sum, item) => sum + item.metrics.utilizationRate, 0) / materialDetails.length : 0;
    
    // Determine period dates
    const periodStart = startDate ? new Date(startDate) : new Date();
    const periodEnd = endDate ? new Date(endDate) : new Date();
    
    const response: MaterialUsageReportResponse = {
      success: true,
      message: 'Rapport d\'utilisation des matériels généré avec succès',
      generatedAt: new Date(),
      data: {
        period: {
          start: periodStart,
          end: periodEnd
        },
        summary: {
          totalMaterials: uniqueMaterials.length,
          activeMaterials: uniqueMaterials.filter(m => m.status === 'AVAILABLE').length,
          averageUtilization,
          totalRentalDays,
          revenue: totalRevenue
        },
        materials: materialDetails,
        categories: Object.values(categoryBreakdownMap),
        trends: periodBreakdownArray
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error generating materials usage report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la génération du rapport d\'utilisation des matériels' 
      },
      { status: 500 }
    );
  }
}
