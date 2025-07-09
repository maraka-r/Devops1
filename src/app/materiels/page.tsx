// Page publique des matériels - Feature principale
// Les clients peuvent voir la liste des matériels et les louer

'use client';

import { useState, useEffect } from 'react';
import { useMaterials } from '@/hooks/api/useMaterials';
import { MaterialSearchFilters, Materiel, MaterielType } from '@/types';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';

// Types pour les filtres et tri
interface SortOption {
  value: string;
  label: string;
}

const sortOptions: SortOption[] = [
  { value: 'name_asc', label: 'Nom A-Z' },
  { value: 'name_desc', label: 'Nom Z-A' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Plus populaires' },
];

const materialTypes = [
  { value: 'ALL', label: 'Tous les types' },
  { value: 'GRUE_MOBILE', label: 'Grues mobiles' },
  { value: 'PELLETEUSE', label: 'Pelleteuses' },
  { value: 'NACELLE_CISEAUX', label: 'Nacelles ciseaux' },
  { value: 'NACELLE_TELESCOPIQUE', label: 'Nacelles télescopiques' },
  { value: 'COMPACTEUR', label: 'Compacteurs' },
  { value: 'CHARIOT_ELEVATEUR', label: 'Chariots élévateurs' },
  { value: 'MARTEAU_PIQUEUR', label: 'Marteaux piqueurs' },
];

export default function MaterielsPage() {
  // Hooks pour la gestion des matériels
  const {
    materials,
    isLoading,
    error,
    totalCount,
    currentPage,
    fetchMaterials,
    clearError
  } = useMaterials();

  // État local pour les filtres et la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentFilters, setCurrentFilters] = useState<MaterialSearchFilters>({});

  // Charger les matériels au montage du composant
  useEffect(() => {
    const initialLoad = async () => {
      const filters: MaterialSearchFilters = {
        page: 1,
        limit: 12,
      };
      setCurrentFilters(filters);
      await fetchMaterials(filters);
    };

    initialLoad();
  }, [fetchMaterials]);

  // Fonction pour rechercher avec les filtres actuels
  const handleSearch = async () => {
    const filters: MaterialSearchFilters = {
      query: searchTerm || undefined,
      type: (selectedType !== 'ALL' ? selectedType as MaterielType : undefined),
      sortBy: sortBy || undefined,
      page: 1,
      limit: 12,
    };

    setCurrentFilters(filters);
    await fetchMaterials(filters);
  };

  // Fonction pour charger plus de matériels (pagination)
  const loadMore = async () => {
    const filters: MaterialSearchFilters = {
      ...currentFilters,
      page: currentPage + 1,
    };

    await fetchMaterials(filters);
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSortBy('name_asc');
    setCurrentFilters({});
    fetchMaterials({ page: 1, limit: 12 });
  };

  // Fonction pour formater le statut
  const getStatusBadge = (status: string) => {
    const statusMap = {
      AVAILABLE: { label: 'Disponible', variant: 'default' as const },
      RENTED: { label: 'À réserver', variant: 'secondary' as const },
      MAINTENANCE: { label: 'Maintenance', variant: 'destructive' as const },
      OUT_OF_ORDER: { label: 'Hors service', variant: 'destructive' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || 
                      { label: status, variant: 'outline' as const };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  // Les fonctions de calcul de disponibilité ont été supprimées car elles ne sont plus utilisées

  // Composant pour une carte de matériel
  const MaterialCard = ({ material }: { material: Materiel }) => (
    <Card className="h-full flex flex-col group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <ImageWithFallback
            src={material.images?.[0]}
            alt={material.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            fallbackIcon="construction"
          />
          <div className="absolute top-2 right-2">
            {getStatusBadge(material.status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4">
        <Link href={`/materiels/${material.id}`}>
          <CardTitle className="text-lg mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer">
            {material.name}
          </CardTitle>
        </Link>
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{material.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Prix/jour:</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(Number(material.pricePerDay))}
            </span>
          </div>
          
          {material.type && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Type:</span>
              <Badge variant="outline" className="text-xs">
                {materialTypes.find(t => t.value === material.type)?.label || material.type}
              </Badge>
            </div>
          )}

          {/* Affichage de la disponibilité supprimé */}
        </div>
      </CardContent>
      
      <CardFooter className="p-4">
        <div className="flex gap-2 w-full">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/materiels/${material.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              Détails
            </Link>
          </Button>
          
          {(material.status === 'AVAILABLE' || material.status === 'RENTED') && (
            <Button 
              asChild 
              className="flex-1" 
              variant={material.status === 'RENTED' ? "default" : "default"}
            >
              <Link href={`/materiels/${material.id}/louer`}>
                <Calendar className="h-4 w-4 mr-2" />
                {material.status === 'AVAILABLE' ? 'Louer' : 'Réserver'}
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header de la page */}
        {/* <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Location de Matériel BTP
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Découvrez notre large gamme de matériel de construction disponible à la location. 
                Qualité professionnelle, prix compétitifs.
              </p>
            </div>
          </div>
        </div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un matériel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
            </div>

            {/* Filtres rapides */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Type de matériel */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Type de matériel" />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tri */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Boutons d'action */}
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1 sm:flex-none">
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </Button>
                
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Résultats */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
                Fermer
              </Button>
            </div>
          </div>
        )}

        {/* Compteur de résultats */}
        {!isLoading && materials.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-600">
              {totalCount} matériel{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Grille des matériels */}
        {isLoading && materials.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Chargement des matériels...</span>
          </div>
        ) : materials.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {materials
                .filter(material => material.status !== 'MAINTENANCE' && material.status !== 'OUT_OF_ORDER')
                .map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
            </div>

            {/* Bouton charger plus */}
            {materials.length < totalCount && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-8"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    'Charger plus de matériels'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun matériel trouvé
              </h3>
              <p className="text-gray-600">
                Essayez de modifier vos critères de recherche ou réinitialisez les filtres.
              </p>
            </div>
            <Button variant="outline" onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
      </div>
    </PublicLayout>
  );
}
