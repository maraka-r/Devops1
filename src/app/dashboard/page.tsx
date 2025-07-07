'use client';

import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wrench, 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useDashboard } from '@/hooks/api/useDashboard';
import { formatCurrency, formatDateFR } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

// Types pour fallback quand les données ne sont pas encore chargées
const fallbackStats = {
  totalUsers: 0,
  totalMateriels: 0,
  totalLocations: 0,
  activeLocations: 0,
  monthlyRevenue: 0,
  materiels: {
    available: 0,
    rented: 0,
    maintenance: 0,
  },
};

const fallbackAlerts = {
  overdueRentals: 0,
  upcomingDeadlines: 0,
  maintenanceNeeded: 0,
  lowStock: 0,
};

function DashboardContent() {
  const { 
    stats, 
    alerts, 
    recentActivity, 
    isLoading, 
    error, 
    refreshAll 
  } = useDashboard({ autoRefresh: true, refreshInterval: 60000 });

  const currentStats = stats || fallbackStats;
  const currentAlerts = alerts || fallbackAlerts;
  const recentLocations = recentActivity?.locations || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Vue d&apos;ensemble de votre activité de location
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshAll} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Link href="/dashboard/locations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle location
              </Button>
            </Link>
            <Link href="/dashboard/materiels/new">
              <Button variant="outline">
                <Wrench className="h-4 w-4 mr-2" />
                Ajouter matériel
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matériel total</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : currentStats.totalMateriels}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentStats.materiels.available} disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations actives</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : currentStats.activeLocations}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentStats.totalLocations} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : currentStats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                +{recentActivity?.newClients || 0} ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus mensuel</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : formatCurrency(currentStats.monthlyRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                vs mois dernier
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Alertes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Locations en retard</span>
                <Badge variant="destructive">
                  {isLoading ? '...' : currentAlerts.overdueRentals}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Échéances proches</span>
                <Badge variant="secondary">
                  {isLoading ? '...' : currentAlerts.upcomingDeadlines}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Maintenance requise</span>
                <Badge variant="outline">
                  {isLoading ? '...' : currentAlerts.maintenanceNeeded}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Stock bas</span>
                <Badge variant="outline">
                  {isLoading ? '...' : currentAlerts.lowStock}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Rentals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Locations récentes</CardTitle>
              <CardDescription>
                Dernières locations effectuées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : recentLocations.length > 0 ? (
                <div className="space-y-4">
                  {recentLocations.slice(0, 3).map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{location.user.name}</p>
                            <p className="text-sm text-muted-foreground">{location.materiel.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateFR(new Date(location.startDate))} - {formatDateFR(new Date(location.endDate))}
                          </span>
                          <span className="font-medium">{formatCurrency(Number(location.totalPrice) || 0)}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          location.status === 'ACTIVE' ? 'default' : 
                          location.status === 'COMPLETED' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {location.status === 'ACTIVE' ? 'Actif' : 
                         location.status === 'COMPLETED' ? 'Terminé' : 
                         location.status === 'PENDING' ? 'En attente' :
                         'Annulé'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune location récente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
