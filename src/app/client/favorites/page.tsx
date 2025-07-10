'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/api/useFavorites';
import { useRouter } from 'next/navigation';
import {
  Search,
  Heart,
  Euro,
  Calendar,
  Trash2,
  Grid3X3,
  List,
  Package,
  Loader2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

// Import the type from the hook to avoid conflicts
type FavoriWithMateriel = ReturnType<typeof useFavorites>['favorites'][0];

function FavoriCard({ favori, viewMode, onRemove }: { 
  favori: FavoriWithMateriel; 
  viewMode: 'grid' | 'list';
  onRemove: (materielId: string) => void;
}) {
  const { materiel } = favori;
  const isAvailable = materiel.status === 'AVAILABLE';

  const handleRemoveFavorite = () => {
    onRemove(materiel.id);
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Image */}
            <div className="w-24 h-24 flex-shrink-0">
              <ImageWithFallback
                src={materiel.images?.[0]}
                alt={materiel.name}
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
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {materiel.name}
                    </h3>
                    <Badge variant="secondary">{materiel.type}</Badge>
                    {!isAvailable && (
                      <Badge variant="destructive">Indisponible</Badge>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {materiel.description || 'Aucune description disponible'}
                  </p>
                  
                  {/* Date d'ajout */}
                  <div className="text-xs text-gray-500">
                    <p>Ajouté le {new Date(favori.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                {/* Prix et actions */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-600 font-semibold mb-3">
                    <Euro className="w-4 h-4" />
                    <span>{Number(materiel.pricePerDay).toLocaleString()} FCFA/jour</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFavorite}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/materiels/${materiel.id}`}>
                        Voir détails
                      </Link>
                    </Button>
                    <Button 
                      size="sm"
                      disabled={!isAvailable}
                      asChild={isAvailable}
                    >
                      {isAvailable ? (
                        <Link href={`/materiels/${materiel.id}/louer`}>
                          <Calendar className="w-4 h-4 mr-1" />
                          Louer
                        </Link>
                      ) : (
                        <>Indisponible</>
                      )}
                    </Button>
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
    <Card className="hover:shadow-lg transition-shadow group">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <ImageWithFallback
            src={materiel.images?.[0]}
            alt={materiel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallbackIcon="construction"
            fill
          />
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFavorite}
              className="bg-white/90 backdrop-blur-sm text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-white">
                Indisponible
              </Badge>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 truncate flex-1">
              {materiel.name}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {materiel.type}
            </Badge>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {materiel.description || 'Aucune description disponible'}
          </p>

          {/* Date d'ajout */}
          <p className="text-xs text-gray-500 mb-3">
            Ajouté le {new Date(favori.createdAt).toLocaleDateString('fr-FR')}
          </p>

          {/* Prix */}
          <div className="flex items-center gap-1 text-green-600 font-semibold mb-4">
            <Euro className="w-4 h-4" />
            <span className="text-lg">{Number(materiel.pricePerDay).toLocaleString()}</span>
            <span className="text-sm">/jour</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/materiels/${materiel.id}`}>
                Détails
              </Link>
            </Button>
            <Button 
              size="sm"
              className="flex-1"
              disabled={!isAvailable}
              asChild={isAvailable}
            >
              {isAvailable ? (
                <Link href={`/materiels/${materiel.id}/louer`}>
                  Louer
                </Link>
              ) : (
                <>Indisponible</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FavorisStats({ favoris }: { favoris: FavoriWithMateriel[] }) {
  const totalFavoris = favoris.length;
  const availableFavoris = favoris.filter(f => f.materiel.status === 'AVAILABLE').length;
  const averagePrice = favoris.reduce((sum, f) => sum + Number(f.materiel.pricePerDay), 0) / favoris.length || 0;
  const recentlyAdded = favoris.filter(f => {
    const daysDiff = (Date.now() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;

  const stats = [
    { label: 'Total favoris', value: totalFavoris, icon: Heart, color: 'text-red-600' },
    { label: 'Disponibles', value: availableFavoris, icon: Package, color: 'text-green-600' },
    { label: 'Prix moyen', value: `${Math.round(averagePrice).toLocaleString()} FCFA`, icon: Euro, color: 'text-blue-600' },
    { label: 'Ajouts récents', value: recentlyAdded, icon: Calendar, color: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-lg font-semibold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function FavorisPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { favorites, isLoading, error, removeFavorite } = useFavorites();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/client/favorites');
    }
  }, [isAuthenticated, router]);

  const handleRemoveFavorite = async (materielId: string) => {
    try {
      await removeFavorite(materielId);
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
    }
  };

  const filteredFavoris = favorites.filter((favori) => {
    const materiel = favori.materiel;
    const matchesSearch = materiel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (materiel.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAvailability = !availableOnly || materiel.status === 'AVAILABLE';
    
    return matchesSearch && matchesAvailability;
  });

  // Affichage de chargement
  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des favoris...</span>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-gray-500 mb-4">
              {error}
            </p>
            <Button onClick={() => window.location.reload()}>
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
        <h1 className="text-2xl font-bold text-gray-900">Mes Favoris</h1>
        <p className="text-gray-600 mt-1">
          Retrouvez tous vos matériels favoris en un clin d&apos;œil
        </p>
      </div>

      {/* Statistiques */}
      <FavorisStats favoris={favorites} />

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher dans vos favoris..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredFavoris.length} favori(s) affiché(s)
        </p>
        {(searchTerm || availableOnly) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setAvailableOnly(false);
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Grille de favoris */}
      {filteredFavoris.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredFavoris.map((favori) => (
            <FavoriCard 
              key={favori.id} 
              favori={favori} 
              viewMode={viewMode}
              onRemove={handleRemoveFavorite}
            />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              Aucun favori pour le moment
            </h3>
            <p className="text-gray-500 mb-4">
              Parcourez le catalogue et ajoutez vos matériels préférés à vos favoris.
            </p>
            <Button asChild>
              <Link href="/client/catalogue">Parcourir le catalogue</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-500 mb-4">
              Essayez de modifier vos critères de recherche.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setAvailableOnly(false);
              }}
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
