'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Wrench,
  FileText,
  Filter
} from 'lucide-react';

// Mock data for reports
const monthlyStats = {
  revenue: 45600,
  revenueChange: 12.5,
  locations: 156,
  locationsChange: 8.2,
  newClients: 12,
  clientsChange: -2.1,
  utilization: 78.5,
  utilizationChange: 5.3
};

const topMaterials = [
  { name: "Pelleteuse CAT 320", rentals: 24, revenue: 12800 },
  { name: "Grue mobile 50T", rentals: 18, revenue: 9600 },
  { name: "Camion-benne 20T", rentals: 22, revenue: 8400 },
  { name: "Compacteur vibrateur", rentals: 15, revenue: 6200 },
  { name: "Mini-pelle 3T", rentals: 28, revenue: 5600 }
];

const topClients = [
  { name: "Entreprise Martin", locations: 12, revenue: 8400 },
  { name: "BTP Solutions", locations: 8, revenue: 6200 },
  { name: "Construction Moderne", locations: 6, revenue: 4800 },
  { name: "Travaux Publics SA", locations: 5, revenue: 3600 },
  { name: "Bâtiment Expert", locations: 4, revenue: 2800 }
];

const monthlyRevenue = [
  { month: "Jan", revenue: 32400 },
  { month: "Fév", revenue: 38200 },
  { month: "Mar", revenue: 41600 },
  { month: "Avr", revenue: 39800 },
  { month: "Mai", revenue: 45600 },
  { month: "Juin", revenue: 43200 }
];

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rapports</h1>
            <p className="text-muted-foreground">
              Analyses et statistiques de votre activité
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d&apos;affaires</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlyStats.revenue)}</div>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(monthlyStats.revenueChange)}`}>
                {getChangeIcon(monthlyStats.revenueChange)}
                {formatPercentage(monthlyStats.revenueChange)} vs mois dernier
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyStats.locations}</div>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(monthlyStats.locationsChange)}`}>
                {getChangeIcon(monthlyStats.locationsChange)}
                {formatPercentage(monthlyStats.locationsChange)} vs mois dernier
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyStats.newClients}</div>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(monthlyStats.clientsChange)}`}>
                {getChangeIcon(monthlyStats.clientsChange)}
                {formatPercentage(monthlyStats.clientsChange)} vs mois dernier
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d&apos;utilisation</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyStats.utilization}%</div>
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(monthlyStats.utilizationChange)}`}>
                {getChangeIcon(monthlyStats.utilizationChange)}
                {formatPercentage(monthlyStats.utilizationChange)} vs mois dernier
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Évolution du chiffre d&apos;affaires
              </CardTitle>
              <CardDescription>
                Revenus des 6 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyRevenue.map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">{item.month}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(item.revenue / Math.max(...monthlyRevenue.map(m => m.revenue))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{formatCurrency(item.revenue)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Materials */}
          <Card>
            <CardHeader>
              <CardTitle>Matériel le plus loué</CardTitle>
              <CardDescription>
                Classement par nombre de locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topMaterials.map((material, index) => (
                  <div key={material.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">{material.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {material.rentals} locations
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(material.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Meilleurs clients</CardTitle>
              <CardDescription>
                Classement par chiffre d&apos;affaires généré
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={client.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">{client.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {client.locations} locations
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(client.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Générer des rapports spécifiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Rapport mensuel complet
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Analyse des clients
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Wrench className="h-4 w-4 mr-2" />
                  Performance du matériel
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Analyse financière
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Tableau de bord personnalisé
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
