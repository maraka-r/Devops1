'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Wrench, 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Plus,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useDashboard } from '@/hooks/api/useDashboard';
import { useLocations } from '@/hooks/api/useLocations';
import { useMaterials } from '@/hooks/api/useMaterials';
import { useClients } from '@/hooks/api/useClients';
import { formatCurrency, formatDateFR } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MaterielType } from '@/types';

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
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // États pour le formulaire de création de location
  const [locationFormData, setLocationFormData] = useState({
    materielId: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  
  // États pour le formulaire d'ajout de matériel
  const [materialFormData, setMaterialFormData] = useState({
    name: '',
    reference: '',
    type: '',
    description: '',
    pricePerDay: 0,
  });
  
  // États pour la disponibilité du matériel (réservé pour future utilisation)
  // const [availability, setAvailability] = useState<{
  //   isAvailable: boolean;
  //   message: string | null;
  //   checking: boolean;
  // }>({
  //   isAvailable: true,
  //   message: null,
  //   checking: false
  // });
  
  const { 
    stats, 
    alerts, 
    recentActivity, 
    isLoading, 
    error, 
    refreshAll 
  } = useDashboard({ autoRefresh: true, refreshInterval: 60000 });
  
  // Hooks pour les locations
  const {
    createLocation,
    // isLoading: isLoadingLocations,
  } = useLocations();
  
  // Hooks pour les matériels
  const {
    materials,
    isLoading: isLoadingMaterials,
    fetchMaterials,
    createMaterial,
    refreshMaterials
  } = useMaterials();
  
  // Hooks pour les clients
  const {
    clients,
    isLoading: isLoadingClients,
    fetchClients
  } = useClients();
  
  // Chargement initial des données
  useEffect(() => {
    fetchMaterials();
    fetchClients();
  }, [fetchMaterials, fetchClients]);
  
  // Fonction pour gérer la création d'une location
  const handleCreateLocation = async () => {
    try {
      if (!locationFormData.materielId || !locationFormData.userId || !locationFormData.startDate || !locationFormData.endDate) {
        return;
      }
      
      const locationData = {
        materielId: locationFormData.materielId,
        userId: locationFormData.userId,
        startDate: locationFormData.startDate,
        endDate: locationFormData.endDate
      };
      
      await createLocation(locationData);
      
      // Réinitialisation du formulaire
      setLocationFormData({
        materielId: '',
        userId: '',
        startDate: '',
        endDate: ''
      });
      
      setIsLocationDialogOpen(false);
      
      setNotification({
        message: 'Location créée avec succès',
        type: 'success'
      });
      
      setTimeout(() => setNotification(null), 3000);
      
      // Rafraîchissement du dashboard
      refreshAll();
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : "Erreur lors de la création de la location",
        type: 'error'
      });
      
      setTimeout(() => setNotification(null), 3000);
    }
  };
  
  // Fonction pour gérer l'ajout d'un matériel
  const handleAddMaterial = async () => {
    try {
      if (!materialFormData.name || !materialFormData.type || materialFormData.pricePerDay <= 0) {
        return;
      }
      
      const materialData = {
        name: materialFormData.name,
        type: materialFormData.type as MaterielType,
        description: materialFormData.description || undefined,
        pricePerDay: materialFormData.pricePerDay,
        specifications: materialFormData.reference ? { reference: materialFormData.reference } : undefined,
      };
      
      await createMaterial(materialData);
      
      // Réinitialisation du formulaire
      setMaterialFormData({
        name: '',
        reference: '',
        type: '',
        description: '',
        pricePerDay: 0,
      });
      
      setIsMaterialDialogOpen(false);
      
      setNotification({
        message: 'Matériel ajouté avec succès',
        type: 'success'
      });
      
      setTimeout(() => setNotification(null), 3000);
      
      // Rafraîchissement des données
      await refreshMaterials();
      refreshAll();
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : "Erreur lors de l'ajout du matériel",
        type: 'error'
      });
      
      setTimeout(() => setNotification(null), 3000);
    }
  };

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
            <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle location
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle location</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour créer une nouvelle location.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="materiel" className="text-right">
                      Matériel
                    </Label>
                    <div className="col-span-3 relative">
                      <Select 
                        value={locationFormData.materielId} 
                        onValueChange={(value) => {
                          setLocationFormData({...locationFormData, materielId: value});
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un matériel" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingMaterials ? (
                            <SelectItem value="loading" disabled>Chargement...</SelectItem>
                          ) : materials && materials.length > 0 ? (
                            materials.map((materiel) => (
                              <SelectItem key={materiel.id} value={materiel.id}>
                                {materiel.name} - {formatCurrency(Number(materiel.pricePerDay))}/jour
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>Aucun matériel disponible</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="client" className="text-right">
                      Client
                    </Label>
                    <Select 
                      value={locationFormData.userId} 
                      onValueChange={(value) => setLocationFormData({...locationFormData, userId: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingClients ? (
                          <SelectItem value="loading" disabled>Chargement...</SelectItem>
                        ) : clients && clients.length > 0 ? (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - {client.email}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>Aucun client disponible</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startDate" className="text-right">
                      Date début
                    </Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      className="col-span-3"
                      value={locationFormData.startDate}
                      onChange={(e) => setLocationFormData({...locationFormData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endDate" className="text-right">
                      Date fin
                    </Label>
                    <Input 
                      id="endDate" 
                      type="date" 
                      className="col-span-3"
                      value={locationFormData.endDate}
                      onChange={(e) => setLocationFormData({...locationFormData, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateLocation}
                    disabled={!locationFormData.materielId || !locationFormData.userId || !locationFormData.startDate || !locationFormData.endDate}
                  >
                    Créer la location
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Wrench className="h-4 w-4 mr-2" />
                  Ajouter matériel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau matériel</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour ajouter un nouveau matériel à votre parc.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nom
                    </Label>
                    <Input 
                      id="name" 
                      className="col-span-3" 
                      placeholder="Ex: Pelleteuse CAT 320" 
                      value={materialFormData.name}
                      onChange={(e) => setMaterialFormData({...materialFormData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reference" className="text-right">
                      Référence
                    </Label>
                    <Input 
                      id="reference" 
                      className="col-span-3" 
                      placeholder="Ex: PEL-001" 
                      value={materialFormData.reference}
                      onChange={(e) => setMaterialFormData({...materialFormData, reference: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Catégorie
                    </Label>
                    <Select
                      value={materialFormData.type}
                      onValueChange={(value) => setMaterialFormData({...materialFormData, type: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GRUE_MOBILE">Grue mobile</SelectItem>
                        <SelectItem value="GRUE_TOUR">Grue tour</SelectItem>
                        <SelectItem value="TELESCOPIQUE">Télescopique</SelectItem>
                        <SelectItem value="NACELLE_CISEAUX">Nacelle ciseaux</SelectItem>
                        <SelectItem value="NACELLE_ARTICULEE">Nacelle articulée</SelectItem>
                        <SelectItem value="NACELLE_TELESCOPIQUE">Nacelle télescopique</SelectItem>
                        <SelectItem value="COMPACTEUR">Compacteur</SelectItem>
                        <SelectItem value="PELLETEUSE">Pelleteuse</SelectItem>
                        <SelectItem value="AUTRE">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input 
                      id="description" 
                      className="col-span-3" 
                      placeholder="Description du matériel" 
                      value={materialFormData.description}
                      onChange={(e) => setMaterialFormData({...materialFormData, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pricePerDay" className="text-right">
                      Prix/jour (€)
                    </Label>
                    <Input 
                      id="pricePerDay" 
                      type="number" 
                      className="col-span-3" 
                      placeholder="150"
                      value={materialFormData.pricePerDay}
                      onChange={(e) => setMaterialFormData({...materialFormData, pricePerDay: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsMaterialDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleAddMaterial}
                    disabled={!materialFormData.name || !materialFormData.type || materialFormData.pricePerDay <= 0}
                  >
                    Ajouter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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

        {/* Notification Display */}
        {notification && (
          <div className={`border rounded-lg p-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span className={notification.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {notification.message}
              </span>
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
