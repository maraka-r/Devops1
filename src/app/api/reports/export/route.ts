import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Types pour les données d'export
interface RevenueExportData {
  title: string;
  period: { startDate?: string; endDate?: string };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  details: Array<{
    id: string;
    client: string;
    materiel: string;
    startDate: Date;
    endDate: Date | null;
    totalPrice: number;
    status: string;
  }>;
}

interface MaterialUsageExportData {
  title: string;
  period: { startDate?: string; endDate?: string };
  summary: {
    totalMaterials: number;
    activeMaterials: number;
    totalRentals: number;
  };
  details: Array<{
    id: string;
    name: string;
    type: string;
    totalRentals: number;
    totalRevenue: number;
    status: string;
  }>;
}

interface ClientAnalysisExportData {
  title: string;
  period: { startDate?: string; endDate?: string };
  summary: {
    totalClients: number;
    totalRevenue: number;
    averageLifetimeValue: number;
  };
  details: Array<{
    id: string;
    name: string;
    email: string;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    lastOrder: Date | null;
  }>;
}

interface PerformanceExportData {
  title: string;
  period: { startDate?: string; endDate?: string };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    utilizationRate: number;
    averageOrderValue: number;
  };
  kpis: Array<{
    name: string;
    value: number;
    unit: string;
  }>;
}

type ExportData = RevenueExportData | MaterialUsageExportData | ClientAnalysisExportData | PerformanceExportData;

interface ExportResult {
  format: string;
  filename?: string;
  url?: string;
  data: ExportData | string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      reportType, 
      format, 
      startDate, 
      endDate, 
      filters = {} 
    } = body;
    
    // Validate required parameters
    if (!reportType || !format) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Type de rapport et format sont requis' 
        },
        { status: 400 }
      );
    }
    
    // Validate report type
    const validReportTypes = ['revenue', 'materials-usage', 'client-analysis', 'performance'];
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Type de rapport invalide' 
        },
        { status: 400 }
      );
    }
    
    // Validate format
    const validFormats = ['pdf', 'excel', 'csv'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Format invalide. Formats supportés: pdf, excel, csv' 
        },
        { status: 400 }
      );
    }
    
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
      ...(filters.clientId && { userId: filters.clientId })
    };
    
    // Get data based on report type
    let reportData: ExportData;
    let filename = '';
    
    switch (reportType) {
      case 'revenue':
        {
          const locations = await prisma.location.findMany({
            where: locationFilters,
            include: {
              user: true,
              materiel: true
            }
          });
          
          const totalRevenue = locations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
          const totalLocations = locations.length;
          
          reportData = {
            title: 'Rapport de Revenus',
            period: { startDate, endDate },
            summary: {
              totalRevenue,
              totalOrders: totalLocations,
              averageOrderValue: totalLocations > 0 ? totalRevenue / totalLocations : 0
            },
            details: locations.map(loc => ({
              id: loc.id,
              client: loc.user.name,
              materiel: loc.materiel.name,
              startDate: loc.startDate,
              endDate: loc.endDate,
              totalPrice: Number(loc.totalPrice),
              status: loc.status
            }))
          };
          
          filename = `rapport-revenus-${new Date().toISOString().split('T')[0]}`;
        }
        break;
        
      case 'materials-usage':
        {
          const locations = await prisma.location.findMany({
            where: locationFilters,
            include: {
              materiel: true,
              user: true
            }
          });
          
          const allMaterials = await prisma.materiel.findMany({
            where: {
              ...(filters.materialId && { id: filters.materialId }),
              ...(filters.category && { type: filters.category })
            }
          });
          
          const materialUsage = allMaterials.map(material => {
            const materialLocations = locations.filter(loc => loc.materielId === material.id);
            return {
              id: material.id,
              name: material.name,
              type: material.type,
              totalRentals: materialLocations.length,
              totalRevenue: materialLocations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0),
              status: material.status
            };
          });
          
          reportData = {
            title: 'Rapport d\'Utilisation des Matériels',
            period: { startDate, endDate },
            summary: {
              totalMaterials: allMaterials.length,
              activeMaterials: allMaterials.filter(m => m.status === 'AVAILABLE').length,
              totalRentals: locations.length
            },
            details: materialUsage
          };
          
          filename = `rapport-utilisation-materiels-${new Date().toISOString().split('T')[0]}`;
        }
        break;
        
      case 'client-analysis':
        {
          const locations = await prisma.location.findMany({
            where: locationFilters,
            include: {
              user: true,
              materiel: true
            }
          });
          
          const allUsers = await prisma.user.findMany();
          const uniqueClientIds = Array.from(new Set(locations.map(loc => loc.userId)));
          const activeClients = allUsers.filter(u => uniqueClientIds.includes(u.id));
          
          const clientAnalysis = activeClients.map(client => {
            const clientLocations = locations.filter(loc => loc.userId === client.id);
            const totalRevenue = clientLocations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
            
            return {
              id: client.id,
              name: client.name,
              email: client.email,
              totalOrders: clientLocations.length,
              totalRevenue,
              averageOrderValue: clientLocations.length > 0 ? totalRevenue / clientLocations.length : 0,
              lastOrder: clientLocations.length > 0 ? 
                new Date(Math.max(...clientLocations.map(loc => new Date(loc.startDate).getTime()))) : null
            };
          });
          
          reportData = {
            title: 'Rapport d\'Analyse des Clients',
            period: { startDate, endDate },
            summary: {
              totalClients: activeClients.length,
              totalRevenue: locations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0),
              averageLifetimeValue: activeClients.length > 0 ? 
                locations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0) / activeClients.length : 0
            },
            details: clientAnalysis
          };
          
          filename = `rapport-analyse-clients-${new Date().toISOString().split('T')[0]}`;
        }
        break;
        
      case 'performance':
        {
          const locations = await prisma.location.findMany({
            where: locationFilters,
            include: {
              user: true,
              materiel: true
            }
          });
          
          const allMaterials = await prisma.materiel.findMany();
          const totalRevenue = locations.reduce((sum, loc) => sum + Number(loc.totalPrice), 0);
          const totalLocations = locations.length;
          const activeMaterials = Array.from(new Set(locations.map(loc => loc.materielId))).length;
          const utilizationRate = allMaterials.length > 0 ? (activeMaterials / allMaterials.length) * 100 : 0;
          
          reportData = {
            title: 'Rapport de Performance',
            period: { startDate, endDate },
            summary: {
              totalRevenue,
              totalOrders: totalLocations,
              utilizationRate,
              averageOrderValue: totalLocations > 0 ? totalRevenue / totalLocations : 0
            },
            kpis: [
              {
                name: 'Chiffre d\'affaires',
                value: totalRevenue,
                unit: 'EUR'
              },
              {
                name: 'Nombre de commandes',
                value: totalLocations,
                unit: 'commandes'
              },
              {
                name: 'Taux d\'utilisation',
                value: utilizationRate,
                unit: '%'
              }
            ]
          };
          
          filename = `rapport-performance-${new Date().toISOString().split('T')[0]}`;
        }
        break;
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Type de rapport non supporté' 
          },
          { status: 400 }
        );
    }
    
    // Generate export data based on format
    let exportResult: ExportResult;
    
    switch (format) {
      case 'pdf':
        // TODO: Implement PDF generation using a library like puppeteer or jsPDF
        exportResult = {
          format: 'pdf',
          url: `/api/exports/pdf/${filename}.pdf`, // Mock URL
          data: reportData,
          message: 'Génération PDF en cours...'
        };
        break;
        
      case 'excel':
        // TODO: Implement Excel generation using a library like xlsx
        exportResult = {
          format: 'excel',
          url: `/api/exports/excel/${filename}.xlsx`, // Mock URL
          data: reportData,
          message: 'Génération Excel en cours...'
        };
        break;
        
      case 'csv':
        // Generate CSV data
        let csvData = '';
        const csvFilename = `${filename}.csv`;
        
        if (reportType === 'revenue' && 'details' in reportData) {
          csvData = 'ID,Client,Matériel,Date début,Date fin,Prix,Statut\\n';
          csvData += (reportData as RevenueExportData).details.map((item) => 
            `${item.id},"${item.client}","${item.materiel}",${item.startDate},${item.endDate},${item.totalPrice},${item.status}`
          ).join('\\n');
        } else if (reportType === 'materials-usage' && 'details' in reportData) {
          csvData = 'ID,Nom,Type,Locations,Revenus,Statut\\n';
          csvData += (reportData as MaterialUsageExportData).details.map((item) => 
            `${item.id},"${item.name}",${item.type},${item.totalRentals},${item.totalRevenue},${item.status}`
          ).join('\\n');
        } else if (reportType === 'client-analysis' && 'details' in reportData) {
          csvData = 'ID,Nom,Email,Commandes,Revenus,Panier moyen,Dernière commande\\n';
          csvData += (reportData as ClientAnalysisExportData).details.map((item) => 
            `${item.id},"${item.name}","${item.email}",${item.totalOrders},${item.totalRevenue},${item.averageOrderValue},${item.lastOrder || 'N/A'}`
          ).join('\\n');
        }
        
        exportResult = {
          format: 'csv',
          filename: csvFilename,
          data: csvData,
          message: 'Données CSV générées'
        };
        break;
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Format d\'export non supporté' 
          },
          { status: 400 }
        );
    }
    
    // Return success response
    const response = {
      success: true,
      message: `Export ${format.toUpperCase()} généré avec succès`,
      data: {
        reportType,
        filename: exportResult.filename || filename,
        generatedAt: new Date(),
        ...exportResult
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error generating report export:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la génération de l\'export' 
      },
      { status: 500 }
    );
  }
}
