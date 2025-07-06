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
  CheckCircle
} from 'lucide-react';

interface Materiel {
  id: number;
  name: string;
  reference: string;
  category: string;
  status: 'DISPONIBLE' | 'LOUE' | 'MAINTENANCE' | 'HORS_SERVICE';
  pricePerDay: number;
  description?: string;
  purchaseDate: string;
  condition: 'NEUF' | 'TRES_BON' | 'BON' | 'MOYEN' | 'MAUVAIS';
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  DISPONIBLE: 'default',
  LOUE: 'secondary',
  MAINTENANCE: 'destructive',
  HORS_SERVICE: 'outline'
} as const;

const statusLabels = {
  DISPONIBLE: 'Disponible',
  LOUE: 'Loué',
  MAINTENANCE: 'Maintenance',
  HORS_SERVICE: 'Hors service'
} as const;

const conditionLabels = {
  NEUF: 'Neuf',
  TRES_BON: 'Très bon',
  BON: 'Bon',
  MOYEN: 'Moyen',
  MAUVAIS: 'Mauvais'
} as const;

export default function MaterielsPage() {
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch materiels
  useEffect(() => {
    fetchMateriels();
  }, []);

  const fetchMateriels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/materiels');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des matériels');
      }
      const data = await response.json();
      setMateriels(data.materiels || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Filter materiels
  const filteredMateriels = materiels.filter(materiel => {
    const matchesSearch = materiel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         materiel.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || materiel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DISPONIBLE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LOUE':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'HORS_SERVICE':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
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
            <Button onClick={fetchMateriels} className="mt-4">
              Réessayer
            </Button>
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
                    placeholder="Nom ou référence..."
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
                    <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                    <SelectItem value="LOUE">Loué</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="HORS_SERVICE">Hors service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Matériels ({filteredMateriels.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMateriels.length === 0 ? (
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
                    <TableHead>Référence</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prix/jour</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMateriels.map((materiel) => (
                    <TableRow key={materiel.id}>
                      <TableCell className="font-medium">{materiel.name}</TableCell>
                      <TableCell>{materiel.reference}</TableCell>
                      <TableCell>{materiel.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(materiel.status)}
                          <Badge variant={statusColors[materiel.status]}>
                            {statusLabels[materiel.status]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{materiel.pricePerDay}€</TableCell>
                      <TableCell>{conditionLabels[materiel.condition]}</TableCell>
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
