'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
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
  Wrench,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useMaterials } from '@/hooks/api/useMaterials';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { formatCurrency } from '@/lib/utils';
import { Materiel, MaterielStatus } from '@/types';

const statusColors = {
  AVAILABLE: 'default',
  RENTED: 'secondary', 
  MAINTENANCE: 'destructive',
  OUT_OF_ORDER: 'outline',
  RETIRED: 'outline'
} as const;

const statusLabels = {
  AVAILABLE: 'Disponible',
  RENTED: 'Loué',
  MAINTENANCE: 'Maintenance',
  OUT_OF_ORDER: 'Hors service',
  RETIRED: 'Retiré'
} as const;

const typeLabels = {
  GRUE_MOBILE: 'Grue mobile',
  GRUE_TOUR: 'Grue tour',
  TELESCOPIQUE: 'Télescopique',
  NACELLE_CISEAUX: 'Nacelle ciseaux',
  NACELLE_ARTICULEE: 'Nacelle articulée',
  NACELLE_TELESCOPIQUE: 'Nacelle télescopique',
  COMPACTEUR: 'Compacteur',
  PELLETEUSE: 'Pelleteuse',
  AUTRE: 'Autre'
} as const;

function MaterielsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Utilisation du hook useMaterials pour la gestion des données
  const {
    materials,
    isLoading,
    error,
    fetchMaterials,
    clearError,
    refreshMaterials
  } = useMaterials();

  // Chargement initial des matériels
  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Filtrage des matériels
  const filteredMaterials = (materials || []).filter((materiel) => {
    if (!materiel) return false;
    const matchesSearch = materiel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchesStatus = statusFilter === 'all' || materiel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: MaterielStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'RENTED':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'OUT_OF_ORDER':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'RETIRED':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const handleRefresh = async () => {
    await refreshMaterials();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des matériels...</p>
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
            <h1 className="text-3xl font-bold">Matériel</h1>
            <p className="text-muted-foreground">
              Gestion de votre parc de matériel BTP
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
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
                  <Input id="name" className="col-span-3" placeholder="Ex: Pelleteuse CAT 320" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reference" className="text-right">
                    Référence
                  </Label>
                  <Input id="reference" className="col-span-3" placeholder="Ex: PEL-001" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Catégorie
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TERRASSEMENT">Terrassement</SelectItem>
                      <SelectItem value="LEVAGE">Levage</SelectItem>
                      <SelectItem value="TRANSPORT">Transport</SelectItem>
                      <SelectItem value="COMPACTAGE">Compactage</SelectItem>
                      <SelectItem value="BETONNAGE">Bétonnage</SelectItem>
                      <SelectItem value="AUTRE">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pricePerDay" className="text-right">
                    Prix/jour (€)
                  </Label>
                  <Input id="pricePerDay" type="number" className="col-span-3" placeholder="150" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Ajouter
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
                    placeholder="Nom du matériel..."
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
                    <SelectItem value="AVAILABLE">Disponible</SelectItem>
                    <SelectItem value="RENTED">Loué</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="OUT_OF_ORDER">Hors service</SelectItem>
                    <SelectItem value="RETIRED">Retiré</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Matériels ({filteredMaterials.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">
                  Aucun matériel trouvé
                </p>
                <p className="text-sm text-muted-foreground">
                  Ajoutez votre premier matériel pour commencer
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prix/jour</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((materiel: Materiel) => (
                    <TableRow key={materiel.id}>
                      <TableCell className="font-medium">{materiel.name}</TableCell>
                      <TableCell>{typeLabels[materiel.type as keyof typeof typeLabels] || materiel.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(materiel.status)}
                          <Badge variant={statusColors[materiel.status]}>
                            {statusLabels[materiel.status]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(Number(materiel.pricePerDay))}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {materiel.description || 'Aucune description'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" title="Voir les détails">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" title="Modifier">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" title="Supprimer">
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

export default function MaterielsPage() {
  return (
    <ProtectedRoute>
      <MaterielsContent />
    </ProtectedRoute>
  );
}
