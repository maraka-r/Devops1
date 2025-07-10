'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useLocations } from '@/hooks/api/useLocations';
import { useMaterials } from '@/hooks/api/useMaterials';
import { useClients } from '@/hooks/api/useClients';
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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [availability, setAvailability] = useState<{
    isAvailable: boolean;
    message: string | null;
    checking: boolean;
  }>({
    isAvailable: true,
    message: null,
    checking: false
  });
  
  // État pour le formulaire de création de location
  const [formData, setFormData] = useState({
    materielId: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  
  // Utilisation des hooks pour la gestion des données
  const {
    locationsWithDetails,
    isLoading: isLoadingLocations,
    error: locationError,
    fetchLocationsWithDetails,
    clearError: clearLocationError,
    refreshLocations,
    createLocation,
    totalCount,
    currentPage
  } = useLocations();
  
  const {
    materials,
    isLoading: isLoadingMaterials,
    fetchMaterials
  } = useMaterials();
  
  const {
    clients,
    isLoading: isLoadingClients,
    fetchClients
  } = useClients();
  
  // Indication de chargement global
  const isLoading = isLoadingLocations || isLoadingMaterials || isLoadingClients;
  const error = locationError;

  // Chargement initial des données
  useEffect(() => {
    fetchLocationsWithDetails();
    fetchMaterials();
    fetchClients();
  }, [fetchLocationsWithDetails, fetchMaterials, fetchClients]);

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

  // Fonction pour gérer la création d'une location
  const handleCreateLocation = async () => {
    try {
      // Vérification des champs obligatoires
      if (!formData.materielId || !formData.userId || !formData.startDate || !formData.endDate) {
        setNotification({
          message: "Veuillez remplir tous les champs obligatoires",
          type: "error"
        });
        return;
      }

      // Vérification que la date de fin est après la date de début
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        setNotification({
          message: "La date de fin doit être postérieure à la date de début",
          type: "error"
        });
        return;
      }

      // Préparation des données pour l'API
      const locationData = {
        materielId: formData.materielId,
        userId: formData.userId, // Bien que non défini dans le type, c'est nécessaire pour l'API
        startDate: formData.startDate,
        endDate: formData.endDate
      };

      // Création de la location
      await createLocation(locationData)
      
      // Réinitialisation du formulaire
      setFormData({
        materielId: '',
        userId: '',
        startDate: '',
        endDate: ''
      });
      
      // Fermeture du popup
      setIsDialogOpen(false);
      
      // Affichage d'une notification de succès
      setNotification({
        message: "Location créée avec succès",
        type: "success"
      });
      
      // Effacement de la notification après 3 secondes
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      // Rafraîchissement de la liste des locations
      // On utilise fetchLocationsWithDetails directement pour s'assurer que les données sont mises à jour
      await fetchLocationsWithDetails();
      // refreshLocations appelle également fetchLocationsWithDetails grâce à notre modification
    } catch (err) {
      // Affichage d'une notification d'erreur
      setNotification({
        message: err instanceof Error ? err.message : "Erreur lors de la création de la location",
        type: "error"
      });
      
      // Effacement de la notification après 3 secondes
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  };

  // Nous utilisons déjà la fonction formatDate plus haut dans le code

  // Fonction pour vérifier la disponibilité du matériel sur la période sélectionnée
  const checkMaterialAvailability = useCallback(async () => {
    // Si tous les champs nécessaires ne sont pas remplis, on ne fait pas de vérification
    if (!formData.materielId || !formData.startDate || !formData.endDate) {
      setAvailability({
        isAvailable: true,
        message: null,
        checking: false
      });
      return;
    }

    try {
      setAvailability(prev => ({...prev, checking: true}));
      
      // Parcourir les locations existantes pour vérifier les conflits
      const conflictingLocations = locationsWithDetails?.filter(location => {
        // Ne pas considérer les locations annulées
        if (location.status === 'CANCELLED') return false;
        
        // Ne regarder que les locations pour le matériel sélectionné
        if (location.materiel?.id !== formData.materielId) return false;
        
        // Convertir les dates en objets Date pour la comparaison
        const existingStart = new Date(location.startDate);
        const existingEnd = new Date(location.endDate);
        const newStart = new Date(formData.startDate);
        const newEnd = new Date(formData.endDate);
        
        // Vérifier s'il y a chevauchement entre les périodes
        // Un chevauchement existe si la nouvelle période commence avant la fin de l'existante
        // ET se termine après le début de l'existante
        return newStart <= existingEnd && newEnd >= existingStart;
      });
      
      if (conflictingLocations && conflictingLocations.length > 0) {
        // Si nous avons trouvé un conflit, on récupère le nom du matériel
        const selectedMaterial = materials?.find(m => m.id === formData.materielId);
        
        // Construire le message d'erreur avec les périodes en conflit
        let errorMessage = `${selectedMaterial?.name || 'Ce matériel'} est déjà réservé sur cette période.`;
        
        // Si on veut afficher les détails des réservations en conflit
        if (conflictingLocations.length === 1) {
          const conflict = conflictingLocations[0];
          errorMessage += ` Réservé du ${formatDate(conflict.startDate)} au ${formatDate(conflict.endDate)}.`;
        } else if (conflictingLocations.length > 1) {
          errorMessage += ` Il existe ${conflictingLocations.length} réservations en conflit.`;
        }
        
        setAvailability({
          isAvailable: false,
          message: errorMessage,
          checking: false
        });
      } else {
        setAvailability({
          isAvailable: true,
          message: null,
          checking: false
        });
      }
    } catch (err) {
      console.error("Erreur lors de la vérification de disponibilité:", err);
      setAvailability({
        isAvailable: false,
        message: "Impossible de vérifier la disponibilité",
        checking: false
      });
    }
  }, [formData.materielId, formData.startDate, formData.endDate, locationsWithDetails, materials]);

  // Vérifier la disponibilité lorsque le matériel ou les dates changent
  useEffect(() => {
    checkMaterialAvailability();
  }, [formData.materielId, formData.startDate, formData.endDate, checkMaterialAvailability]);

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
              <Button onClick={clearLocationError} variant="ghost">
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

          {/* Notification */}
          {notification && (
            <div className={`fixed top-4 right-4 p-4 rounded-md shadow-md z-50 ${
              notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className="flex items-center">
                {notification.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <p>{notification.message}</p>
              </div>
            </div>
          )}

          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              // Reset availability state when dialog is opened or closed
              if (!open || open) {
                setAvailability({
                  isAvailable: true,
                  message: null,
                  checking: false
                });
              }
            }}
          >
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
                      value={formData.materielId} 
                      onValueChange={(value) => {
                        setFormData({...formData, materielId: value});
                        // Immédiatement vérifier la disponibilité si les dates sont déjà sélectionnées
                        if (formData.startDate && formData.endDate) {
                          setAvailability(prev => ({...prev, checking: true}));
                        }
                      }}
                    >
                      <SelectTrigger className={formData.materielId && !availability.isAvailable ? 'border-red-300 focus:ring-red-500' : ''}>
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
                    {formData.materielId && formData.startDate && formData.endDate && !availability.isAvailable && (
                      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">
                    Client
                  </Label>
                  <Select 
                    value={formData.userId} 
                    onValueChange={(value) => setFormData({...formData, userId: value})}
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
                  <div className="col-span-3 relative">
                    <Input 
                      id="startDate" 
                      type="date" 
                      className={`w-full ${formData.materielId && !availability.isAvailable ? 'border-red-300 focus:ring-red-500' : ''}`}
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData({...formData, startDate: e.target.value});
                        // Immédiatement vérifier la disponibilité si le matériel et la date de fin sont déjà sélectionnés
                        if (formData.materielId && formData.endDate) {
                          setAvailability(prev => ({...prev, checking: true}));
                        }
                      }}
                    />
                    {formData.materielId && formData.startDate && formData.endDate && !availability.isAvailable && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    Date fin
                  </Label>
                  <div className="col-span-3 relative">
                    <Input 
                      id="endDate" 
                      type="date" 
                      className={`w-full ${formData.materielId && !availability.isAvailable ? 'border-red-300 focus:ring-red-500' : ''}`}
                      value={formData.endDate}
                      onChange={(e) => {
                        setFormData({...formData, endDate: e.target.value});
                        // Immédiatement vérifier la disponibilité si le matériel et la date de début sont déjà sélectionnés
                        if (formData.materielId && formData.startDate) {
                          setAvailability(prev => ({...prev, checking: true}));
                        }
                      }}
                    />
                    {formData.materielId && formData.startDate && formData.endDate && !availability.isAvailable && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Message de disponibilité */}
              {formData.materielId && formData.startDate && formData.endDate && (
                availability.isAvailable ? (
                  <div className="flex items-center gap-2 p-3 mb-2 border border-green-200 rounded bg-green-50 text-green-700">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">Le matériel est disponible sur cette période</p>
                  </div>
                ) : availability.message && (
                  <div className="flex items-center gap-2 p-3 mb-2 border border-red-200 rounded bg-red-50 text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">{availability.message}</p>
                  </div>
                )
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreateLocation} 
                  disabled={
                    !formData.materielId || 
                    !formData.userId || 
                    !formData.startDate || 
                    !formData.endDate || 
                    isLoading || 
                    !availability.isAvailable ||
                    availability.checking
                  }
                  className="relative"
                >
                  {availability.checking ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
                      Vérification...
                    </>
                  ) : isLoading ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
                      Création...
                    </>
                  ) : (
                    "Créer"
                  )}
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
              <>
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
                
                {/* Pagination */}
                {totalCount > 0 && (
                  <div className="flex items-center justify-between border-t border-border px-2 py-4 mt-4">
                    <div className="text-sm text-muted-foreground">
                      Affichage de <span className="font-medium">{filteredLocations.length}</span> sur{" "}
                      <span className="font-medium">{totalCount}</span> locations
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (currentPage > 1) {
                            const newPage = currentPage - 1;
                            fetchLocationsWithDetails({ page: newPage, limit: 10 });
                          }
                        }}
                        disabled={currentPage <= 1 || isLoading}
                      >
                        Précédent
                      </Button>
                      <span className="text-sm font-medium">
                        Page {currentPage} sur {Math.ceil(totalCount / 10)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (currentPage < Math.ceil(totalCount / 10)) {
                            const newPage = currentPage + 1;
                            fetchLocationsWithDetails({ page: newPage, limit: 10 });
                          }
                        }}
                        disabled={currentPage >= Math.ceil(totalCount / 10) || isLoading}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
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
