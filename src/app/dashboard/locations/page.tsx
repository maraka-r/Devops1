'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useLocations } from '@/hooks/api/useLocations';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { formatCurrency } from '@/lib/utils';
import { LocationWithDetails, LocationStatus } from '@/types';

const statusColors = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  ACTIVE: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive'
} as const;

const statusLabels = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  ACTIVE: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée'
} as const;

function LocationsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Utilisation du hook useLocations pour la gestion des données
  const {
    locationsWithDetails,
    isLoading,
    error,
    fetchLocationsWithDetails,
    clearError,
    refreshLocations
  } = useLocations();

  // Chargement initial des locations
  useEffect(() => {
    fetchLocationsWithDetails();
  }, [fetchLocationsWithDetails]);

  // Filtrage des locations
  const filteredLocations = (locationsWithDetails || []).filter(location => {
    if (!location || !location.materiel || !location.user) return false;
    const matchesSearch = location.materiel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.materiel.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: LocationStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'ACTIVE':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRefresh = async () => {
    await refreshLocations();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des locations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-red-600">{error}</p>
            <div className="flex gap-2 mt-4 justify-center">
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              <Button onClick={clearError} variant="ghost">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Locations</h1>
            <p className="text-muted-foreground">
              Gestion des locations de matériel
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un matériel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Pelleteuse CAT 320</SelectItem>
                      <SelectItem value="2">Grue mobile 50T</SelectItem>
                      <SelectItem value="3">Camion-benne 20T</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">
                    Client
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Entreprise Martin</SelectItem>
                      <SelectItem value="2">BTP Solutions</SelectItem>
                      <SelectItem value="3">Construction Moderne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Date début
                  </Label>
                  <Input id="startDate" type="date" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    Date fin
                  </Label>
                  <Input id="endDate" type="date" className="col-span-3" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Créer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Client, matériel ou référence..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Label htmlFor="status">Statut</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="EN_COURS">En cours</SelectItem>
                    <SelectItem value="TERMINEE">Terminée</SelectItem>
                    <SelectItem value="ANNULEE">Annulée</SelectItem>
                    <SelectItem value="EN_RETARD">En retard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Locations ({filteredLocations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLocations.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">
                  Aucune location trouvée
                </p>
                <p className="text-sm text-muted-foreground">
                  Créez votre première location pour commencer
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matériel</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prix total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location: LocationWithDetails) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{location.materiel.name}</div>
                          <div className="text-sm text-muted-foreground">{location.materiel.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{location.user.name}</div>
                          <div className="text-sm text-muted-foreground">{location.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(location.startDate)} - {formatDate(location.endDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {calculateDuration(location.startDate, location.endDate)} jours
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(location.status)}
                          <Badge variant={statusColors[location.status]}>
                            {statusLabels[location.status]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(location.totalPrice))}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function LocationsPageProtected() {
  return (
    <ProtectedRoute>
      <LocationsContent />
    </ProtectedRoute>
  );
}

export default LocationsPageProtected;
