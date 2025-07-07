import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

/**
 * GET /api/dashboard/admin/alerts
 * Retourne les alertes et notifications importantes pour l'admin
 * Query params:
 * - severity: 'low', 'medium', 'high', 'critical' (default: all)
 * - type: 'invoice', 'material', 'location', 'system' (default: all)
 * - limit: nombre maximum de résultats (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Vérifier l'authentification et les permissions admin
    // const authUser = await getCurrentUser();
    // if (!authUser || authUser.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Accès refusé. Permissions administrateur requises.' },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const severityFilter = searchParams.get('severity');
    const typeFilter = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    const now = new Date();
    const alerts: Array<{
      id: string;
      type: 'invoice' | 'material' | 'location' | 'system';
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      message: string;
      data: Record<string, unknown>;
      createdAt: Date;
      actionRequired: boolean;
      actionUrl?: string;
    }> = [];

    // 1. Alertes de facturation
    if (!typeFilter || typeFilter === 'invoice') {
      // Factures en retard
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          status: 'PENDING',
          dueDate: { lt: now }
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { dueDate: 'asc' }
      });

      overdueInvoices.forEach(invoice => {
        const daysOverdue = Math.ceil((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `overdue-invoice-${invoice.id}`,
          type: 'invoice',
          severity: daysOverdue > 30 ? 'critical' : daysOverdue > 15 ? 'high' : 'medium',
          title: `Facture en retard - ${invoice.number}`,
          message: `Facture de ${Number(invoice.totalAmount).toFixed(2)}€ pour ${invoice.user.name} en retard de ${daysOverdue} jour(s)`,
          data: {
            invoiceId: invoice.id,
            amount: Number(invoice.totalAmount),
            daysOverdue,
            client: invoice.user.name,
            dueDate: invoice.dueDate
          },
          createdAt: invoice.dueDate,
          actionRequired: true,
          actionUrl: `/admin/invoices/${invoice.id}`
        });
      });

      // Factures importantes créées récemment
      const highValueInvoices = await prisma.invoice.findMany({
        where: {
          status: 'PENDING',
          totalAmount: { gt: 1000 },
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      highValueInvoices.forEach(invoice => {
        alerts.push({
          id: `high-value-invoice-${invoice.id}`,
          type: 'invoice',
          severity: 'medium',
          title: `Facture importante - ${invoice.number}`,
          message: `Nouvelle facture de ${Number(invoice.totalAmount).toFixed(2)}€ pour ${invoice.user.name}`,
          data: {
            invoiceId: invoice.id,
            amount: Number(invoice.totalAmount),
            client: invoice.user.name,
            createdAt: invoice.createdAt
          },
          createdAt: invoice.createdAt,
          actionRequired: false,
          actionUrl: `/admin/invoices/${invoice.id}`
        });
      });
    }

    // 2. Alertes de matériel
    if (!typeFilter || typeFilter === 'material') {
      // Matériels avec problèmes (simulé - à implémenter selon les besoins)
      const allMaterials = await prisma.materiel.findMany({
        include: {
          locations: {
            where: { status: 'ACTIVE' },
            orderBy: { startDate: 'desc' },
            take: 1
          }
        }
      });

      // Matériels très demandés (plus de 80% d'utilisation)
      const highDemandMaterials = await prisma.location.groupBy({
        by: ['materielId'],
        where: {
          createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        },
        _count: {
          materielId: true
        },
        having: {
          materielId: {
            _count: {
              gt: 10
            }
          }
        }
      });

      for (const demand of highDemandMaterials) {
        const material = allMaterials.find(m => m.id === demand.materielId);
        if (material) {
          alerts.push({
            id: `high-demand-material-${material.id}`,
            type: 'material',
            severity: 'medium',
            title: `Matériel très demandé - ${material.name}`,
            message: `Le matériel ${material.name} a été loué ${demand._count.materielId} fois ce mois`,
            data: {
              materialId: material.id,
              name: material.name,
              rentals: demand._count.materielId,
              type: material.type
            },
            createdAt: now,
            actionRequired: false,
            actionUrl: `/admin/materials/${material.id}`
          });
        }
      }
    }

    // 3. Alertes de location
    if (!typeFilter || typeFilter === 'location') {
      // Locations qui se terminent bientôt
      const endingSoonLocations = await prisma.location.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: now,
            lte: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 jours
          }
        },
        include: {
          user: {
            select: { name: true, email: true, phone: true }
          },
          materiel: {
            select: { name: true, type: true }
          }
        },
        orderBy: { endDate: 'asc' }
      });

      endingSoonLocations.forEach(location => {
        const hoursRemaining = Math.ceil((location.endDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        alerts.push({
          id: `ending-soon-location-${location.id}`,
          type: 'location',
          severity: hoursRemaining < 24 ? 'high' : 'medium',
          title: `Location se termine bientôt`,
          message: `Location de ${location.materiel.name} pour ${location.user.name} se termine dans ${hoursRemaining}h`,
          data: {
            locationId: location.id,
            client: location.user.name,
            material: location.materiel.name,
            endDate: location.endDate,
            hoursRemaining
          },
          createdAt: location.endDate,
          actionRequired: true,
          actionUrl: `/admin/locations/${location.id}`
        });
      });

      // Locations en retard
      const overdueLocations = await prisma.location.findMany({
        where: {
          status: 'ACTIVE',
          endDate: { lt: now }
        },
        include: {
          user: {
            select: { name: true, email: true, phone: true }
          },
          materiel: {
            select: { name: true, type: true }
          }
        },
        orderBy: { endDate: 'asc' }
      });

      overdueLocations.forEach(location => {
        const hoursOverdue = Math.ceil((now.getTime() - location.endDate.getTime()) / (1000 * 60 * 60));
        alerts.push({
          id: `overdue-location-${location.id}`,
          type: 'location',
          severity: hoursOverdue > 48 ? 'critical' : 'high',
          title: `Location en retard`,
          message: `Location de ${location.materiel.name} pour ${location.user.name} en retard de ${hoursOverdue}h`,
          data: {
            locationId: location.id,
            client: location.user.name,
            material: location.materiel.name,
            endDate: location.endDate,
            hoursOverdue
          },
          createdAt: location.endDate,
          actionRequired: true,
          actionUrl: `/admin/locations/${location.id}`
        });
      });
    }

    // 4. Alertes système
    if (!typeFilter || typeFilter === 'system') {
      // Nouveaux utilisateurs (dernières 24h)
      const newUsers = await prisma.user.count({
        where: {
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        }
      });

      if (newUsers > 0) {
        alerts.push({
          id: `new-users-${now.getTime()}`,
          type: 'system',
          severity: 'low',
          title: `Nouveaux utilisateurs`,
          message: `${newUsers} nouveau(x) utilisateur(s) inscrit(s) dans les dernières 24h`,
          data: {
            count: newUsers,
            period: '24h'
          },
          createdAt: now,
          actionRequired: false,
          actionUrl: '/admin/users'
        });
      }

      // Vérification des performances (simulé)
      const totalMaterials = await prisma.materiel.count();
      
      if (totalMaterials > 0) {
        const activeLocationsCount = await prisma.location.count({ where: { status: 'ACTIVE' } });
        const utilizationRate = activeLocationsCount / totalMaterials;
        
        if (utilizationRate > 0.9) {
          alerts.push({
            id: `high-utilization-${now.getTime()}`,
            type: 'system',
            severity: 'medium',
            title: `Taux d'utilisation élevé`,
            message: `Taux d'utilisation des matériels: ${Math.round(utilizationRate * 100)}%`,
            data: {
              utilizationRate: Math.round(utilizationRate * 100),
              activeLocations: activeLocationsCount,
              totalMaterials
            },
            createdAt: now,
            actionRequired: false,
            actionUrl: '/admin/materials'
          });
        }
      }
    }

    // Filtrer par sévérité si spécifiée
    let filteredAlerts = alerts;
    if (severityFilter) {
      filteredAlerts = alerts.filter(alert => alert.severity === severityFilter);
    }

    // Trier par sévérité puis par date
    const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    filteredAlerts.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Limiter les résultats
    const limitedAlerts = filteredAlerts.slice(0, limit);

    // Calculer les statistiques
    const stats = {
      total: filteredAlerts.length,
      critical: filteredAlerts.filter(a => a.severity === 'critical').length,
      high: filteredAlerts.filter(a => a.severity === 'high').length,
      medium: filteredAlerts.filter(a => a.severity === 'medium').length,
      low: filteredAlerts.filter(a => a.severity === 'low').length,
      actionRequired: filteredAlerts.filter(a => a.actionRequired).length,
      byType: {
        invoice: filteredAlerts.filter(a => a.type === 'invoice').length,
        material: filteredAlerts.filter(a => a.type === 'material').length,
        location: filteredAlerts.filter(a => a.type === 'location').length,
        system: filteredAlerts.filter(a => a.type === 'system').length
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        alerts: limitedAlerts.map(alert => ({
          ...alert,
          createdAt: formatDate(alert.createdAt)
        })),
        stats,
        metadata: {
          filters: {
            severity: severityFilter,
            type: typeFilter
          },
          limit,
          generatedAt: formatDate(now)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
