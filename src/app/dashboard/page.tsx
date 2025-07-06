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
  Plus
} from 'lucide-react';

// Mock data - in a real app, this would come from your API
const stats = {
  totalMaterials: 45,
  activeRentals: 23,
  totalClients: 87,
  monthlyRevenue: 12450,
  availableMaterials: 22,
  overdueRentals: 3,
  upcomingDeadlines: 8,
  maintenanceNeeded: 2
};

const recentRentals = [
  {
    id: 1,
    client: "Entreprise Martin",
    material: "Pelleteuse CAT 320",
    startDate: "2024-01-15",
    endDate: "2024-01-25",
    status: "active",
    amount: 2400
  },
  {
    id: 2,
    client: "BTP Solutions",
    material: "Grue mobile 50T",
    startDate: "2024-01-10",
    endDate: "2024-01-20",
    status: "overdue",
    amount: 3200
  },
  {
    id: 3,
    client: "Construction Moderne",
    material: "Camion-benne 20T",
    startDate: "2024-01-18",
    endDate: "2024-01-28",
    status: "active",
    amount: 1800
  }
];

export default function DashboardPage() {
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
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle location
            </Button>
            <Button variant="outline">
              <Wrench className="h-4 w-4 mr-2" />
              Ajouter matériel
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matériel total</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMaterials}</div>
              <p className="text-xs text-muted-foreground">
                {stats.availableMaterials} disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations actives</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRentals}</div>
              <p className="text-xs text-muted-foreground">
                +3 depuis hier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                +12% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus mensuel</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()}€</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +8% vs mois dernier
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
                <Badge variant="destructive">{stats.overdueRentals}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Échéances proches</span>
                <Badge variant="secondary">{stats.upcomingDeadlines}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Maintenance requise</span>
                <Badge variant="outline">{stats.maintenanceNeeded}</Badge>
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
              <div className="space-y-4">
                {recentRentals.map((rental) => (
                  <div key={rental.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{rental.client}</p>
                          <p className="text-sm text-muted-foreground">{rental.material}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {rental.startDate} - {rental.endDate}
                        </span>
                        <span className="font-medium">{rental.amount}€</span>
                      </div>
                    </div>
                    <Badge 
                      variant={rental.status === 'active' ? 'default' : 'destructive'}
                    >
                      {rental.status === 'active' ? 'Actif' : 'En retard'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
