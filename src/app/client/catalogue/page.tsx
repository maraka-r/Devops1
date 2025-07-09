'use client';

import { useState, useEffect } from 'react';
import { useMaterials } from '@/hooks/api/useMaterials';
import { useFavorites } from '@/hooks/api/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialSearchFilters, Materiel, MaterielType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Calendar, Loader2, AlertCircle, Heart, Grid3X3, List } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function ClientCataloguePage() {
  // Hooks pour la gestion des matériels et favoris
  const {
    materials,
    isLoading,
    error,
    totalCount,
    currentPage,
    fetchMaterials,
    clearError
  } = useMaterials();

  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // État local pour les filtres et la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFilters, setCurrentFilters] = useState<MaterialSearchFilters>({});
  const [favoriteLoadingStates, setFavoriteLoadingStates] = useState<Record<string, boolean>>({});

  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/client/catalogue');
    }
  }, [isAuthenticated, router]);

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

  // Fonction pour gérer les favoris
  const handleToggleFavorite = async (materielId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      setFavoriteLoadingStates(prev => ({ ...prev, [materielId]: true }));
      await toggleFavorite(materielId);
    } catch (error) {
      console.error('Erreur lors de la gestion du favori:', error);
    } finally {
      setFavoriteLoadingStates(prev => ({ ...prev, [materielId]: false }));
    }
  };

  // Fonction pour rechercher avec les filtres actuels
  const handleSearch = async () => {
    const filters: MaterialSearchFilters = {
      query: searchTerm || undefined,
      type: (selectedType !== 'ALL' ? selectedType as MaterielType : undefined),
      sortBy: sortBy || undefined,
      status: availableOnly ? 'AVAILABLE' : undefined,
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
    setAvailableOnly(false);
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

  // Composant pour une carte de matériel
  const MaterialCard = ({ material }: { material: Materiel }) => {
    const isInFavorites = isFavorite(material.id);
    const isLoadingFavorite = favoriteLoadingStates[material.id] || false;

    if (viewMode === 'list') {
      return (
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* Image */}
              <div className="w-24 h-24 flex-shrink-0">
                <ImageWithFallback
                  src={material.images?.[0]}
                  alt={material.name}
                  className="w-full h-full object-cover rounded-lg"
                  fallbackIcon="construction"
                  width={96}
                  height={96}
                />
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/materiels/${material.id}`}>
                        <h3 className="font-semibold text-lg text-gray-900 truncate hover:text-primary transition-colors cursor-pointer">
                          {material.name}
                        </h3>
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {materialTypes.find(t => t.value === material.type)?.label || material.type}
                      </Badge>
                      {getStatusBadge(material.status)}
                    </div>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {material.description || 'Aucune description disponible'}
                    </p>
                  </div>

                  {/* Prix et actions */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary font-semibold mb-3">
                      <span className="text-lg">{formatPrice(Number(material.pricePerDay))}</span>
                      <span className="text-sm">/jour</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleToggleFavorite(material.id, e)}
                        disabled={isLoadingFavorite}
                        className={isInFavorites ? 'text-red-500 hover:text-red-700' : 'text-gray-500 hover:text-gray-700'}
                      >
                        <Heart className={`w-4 h-4 ${isInFavorites ? 'fill-current' : ''}`} />
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/materiels/${material.id}`}>
                          Voir détails
                        </Link>
                      </Button>
                      {(material.status === 'AVAILABLE' || material.status === 'RENTED') && (
                        <Button 
                          size="sm"
                          asChild
                        >
                          <Link href={`/materiels/${material.id}/louer`}>
                            <Calendar className="w-4 h-4 mr-1" />
                            {material.status === 'AVAILABLE' ? 'Louer' : 'Réserver'}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
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
            {/* Bouton favoris */}
            <div className="absolute top-2 left-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
                onClick={(e) => handleToggleFavorite(material.id, e)}
                disabled={isLoadingFavorite}
              >
                <Heart 
                  className={`h-4 w-4 ${isInFavorites ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                />
              </Button>
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
  };

  // États de chargement et d'erreur
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-gray-500 mb-4">
              {error}
            </p>
            <Button onClick={clearError}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catalogue</h1>
        <p className="text-gray-600 mt-1">
          Découvrez notre gamme complète de matériel BTP
        </p>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Ligne 1: Recherche */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher un matériel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Rechercher
              </Button>
            </div>

            {/* Ligne 2: Filtres */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
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
              </div>

              <div className="flex-1">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
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
              </div>

              <div className="flex gap-2">
                {/* Filtre disponibilité */}
                <Button
                  variant={availableOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAvailableOnly(!availableOnly)}
                >
                  Disponibles uniquement
                </Button>

                {/* Mode d'affichage */}
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Réinitialiser */}
                {(searchTerm || selectedType !== 'ALL' || sortBy !== 'name_asc' || availableOnly) && (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {totalCount} matériel(s) trouvé(s)
        </p>
      </div>

      {/* Liste des matériels */}
      {isLoading && materials.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Chargement des matériels...</p>
          </div>
        </div>
      ) : materials.length > 0 ? (
        <>
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>

          {/* Bouton Charger plus */}
          {materials.length < totalCount && (
            <div className="flex justify-center pt-8">
              <Button 
                onClick={loadMore} 
                disabled={isLoading}
                variant="outline"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Charger plus de matériels
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              Aucun matériel trouvé
            </h3>
            <p className="text-gray-500 mb-4">
              Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.
            </p>
            <Button onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
