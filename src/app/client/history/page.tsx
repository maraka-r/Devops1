'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { useAuth } from '@/contexts/AuthContext';
import { useLocations } from '@/hooks/api/useLocations';
import { useRouter } from 'next/navigation';
import {
  Package,
  Calendar,
  MapPin,
  Euro,
  Search,
  Filter,
  Download,
  Eye,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

// Types
interface HistoriqueLocation {
  id: string;
  materiel: {
    id: string;
    name: string;
    images?: string[];
    type: string;
  };
  startDate: Date;
  endDate: Date;
  status: 'COMPLETED' | 'CANCELLED' | 'ACTIVE' | 'PENDING';
  totalPrice: number;
  notes?: string;
  deliveryAddress?: string;
  rating?: number;
  createdAt: Date;
}

const statusConfig = {
  COMPLETED: { label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle },
  ACTIVE: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Clock },
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
};

function HistoriqueCard({ location }: { location: HistoriqueLocation }) {
  const config = statusConfig[location.status as keyof typeof statusConfig];
  const StatusIcon = config?.icon || Clock;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Image du matériel */}
          <div className="w-20 h-20 flex-shrink-0">
            <ImageWithFallback
              src={location.materiel.images?.[0]}
              alt={location.materiel.name}
              className="w-full h-full object-cover rounded-lg"
              fallbackIcon="construction"
              width={80}
              height={80}
            />
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {location.materiel.name}
                </h3>
                <p className="text-sm text-gray-500">{location.materiel.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={config?.color || 'bg-gray-100 text-gray-800'}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {config?.label || location.status}
                </Badge>
              </div>
            </div>

            {/* Informations de la location */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Du {new Date(location.startDate).toLocaleDateString('fr-FR')} au{' '}
                  {new Date(location.endDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {location.deliveryAddress && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{location.deliveryAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Créé le {new Date(location.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-2 font-medium text-green-600">
                <Euro className="w-4 h-4" />
                <span>{Number(location.totalPrice).toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Rating */}
            {location.rating && location.status === 'COMPLETED' && (
              <div className="mt-3 flex items-center gap-1">
                <span className="text-sm text-gray-600">Évaluation :</span>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < location.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Notes */}
            {location.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{location.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/client/history/${location.id}`}>
                  <Eye className="w-4 h-4 mr-1" />
                  Détails
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Facture
              </Button>
              {location.status === 'COMPLETED' && !location.rating && (
                <Button variant="outline" size="sm">
                  <Star className="w-4 h-4 mr-1" />
                  Évaluer
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoriqueStats({ locations }: { locations: HistoriqueLocation[] }) {
  const completedCount = locations.filter((l: HistoriqueLocation) => l.status === 'COMPLETED').length;
  const cancelledCount = locations.filter((l: HistoriqueLocation) => l.status === 'CANCELLED').length;
  const totalSpent = locations
    .filter((l: HistoriqueLocation) => l.status === 'COMPLETED')
    .reduce((sum: number, l: HistoriqueLocation) => sum + Number(l.totalPrice), 0);
  const avgRating = locations
    .filter((l: HistoriqueLocation) => l.rating)
    .reduce((sum: number, l: HistoriqueLocation, _: number, arr: HistoriqueLocation[]) => sum + (l.rating || 0) / arr.length, 0);

  const stats = [
    { label: 'Locations terminées', value: completedCount, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Locations annulées', value: cancelledCount, icon: XCircle, color: 'text-red-600' },
    { label: 'Total dépensé', value: `${totalSpent.toLocaleString()} FCFA`, icon: Euro, color: 'text-blue-600' },
    { label: 'Note moyenne', value: avgRating ? avgRating.toFixed(1) : '0', icon: Star, color: 'text-yellow-600' },
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

export default function HistoriquePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { locationsWithDetails, isLoading, error } = useLocations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'COMPLETED' | 'CANCELLED' | 'ACTIVE' | 'PENDING'>('all');

  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/client/history');
    }
  }, [isAuthenticated, router]);

  // Charger les locations avec détails au montage
  useEffect(() => {
    if (isAuthenticated && user) {
      // Le hook chargera automatiquement les données
    }
  }, [isAuthenticated, user]);

  // Filtrer les locations pour ne garder que celles de l'utilisateur connecté
  const userLocations = locationsWithDetails?.filter(location => location.userId === user?.id) || [];

  // Convertir les locations pour correspondre à notre interface HistoriqueLocation
  const historiqueLocations: HistoriqueLocation[] = userLocations.map(location => ({
    id: location.id,
    materiel: {
      id: location.materiel.id,
      name: location.materiel.name,
      images: location.materiel.images || [],
      type: location.materiel.type,
    },
    startDate: new Date(location.startDate),
    endDate: new Date(location.endDate),
    status: location.status as HistoriqueLocation['status'],
    totalPrice: Number(location.totalPrice),
    notes: location.notes || undefined,
    rating: undefined, // TODO: Ajouter le système de notation
    createdAt: new Date(location.createdAt),
  }));

  const filteredHistorique = historiqueLocations.filter((location) => {
    const matchesSearch = location.materiel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.materiel.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Affichage de chargement
  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement de l&apos;historique...</span>
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
        <h1 className="text-2xl font-bold text-gray-900">Historique</h1>
        <p className="text-gray-600 mt-1">
          Consultez l&apos;historique de toutes vos locations passées
        </p>
      </div>

      {/* Statistiques */}
      <HistoriqueStats locations={historiqueLocations} />

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom ou type de matériel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                <Filter className="w-4 h-4 mr-1" />
                Toutes
              </Button>
              <Button
                variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('COMPLETED')}
              >
                Terminées
              </Button>
              <Button
                variant={statusFilter === 'CANCELLED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('CANCELLED')}
              >
                Annulées
              </Button>
              <Button
                variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ACTIVE')}
              >
                En cours
              </Button>
              <Button
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDING')}
              >
                En attente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste de l'historique */}
      {filteredHistorique.length > 0 ? (
        <div className="space-y-4">
          {filteredHistorique.map((location) => (
            <HistoriqueCard key={location.id} location={location} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              {historiqueLocations.length === 0 ? 'Aucune location trouvée' : 'Aucun résultat trouvé'}
            </h3>
            <p className="text-gray-500 mb-4">
              {historiqueLocations.length === 0 
                ? 'Vous n\'avez pas encore effectué de location.'
                : 'Essayez de modifier vos critères de recherche ou filtres.'
              }
            </p>
            {historiqueLocations.length === 0 ? (
              <Button asChild>
                <Link href="/client/catalogue">
                  Parcourir le catalogue
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
