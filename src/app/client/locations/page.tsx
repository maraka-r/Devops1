'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { useAuth } from '@/contexts/AuthContext';
import { useLocations } from '@/hooks/api/useLocations';
import { LocationWithDetails } from '@/types';
import {
  Package,
  Calendar,
  MapPin,
  Phone,
  Euro,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Download,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusConfig = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  CONFIRMED: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  ACTIVE: { label: 'En cours', color: 'bg-green-100 text-green-800', icon: Clock },
  COMPLETED: { label: 'Terminée', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle },
};

function LocationCard({ location }: { location: LocationWithDetails }) {
  const config = statusConfig[location.status];
  const StatusIcon = config.icon;

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
              <Badge className={config.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
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
              {location.user?.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{location.user.address}</span>
                </div>
              )}
              {location.user?.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{location.user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 font-medium text-green-600">
                <Euro className="w-4 h-4" />
                <span>{Number(location.totalPrice).toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Notes */}
            {location.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{location.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/client/locations/${location.id}`}>
                  <Eye className="w-4 h-4 mr-1" />
                  Détails
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Contrat
              </Button>
              {location.status === 'ACTIVE' && (
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Contact
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LocationsStats({ locations }: { locations: LocationWithDetails[] }) {
  const stats = [
    { label: 'Locations actives', value: locations.filter(l => l.status === 'ACTIVE').length, icon: Clock, color: 'text-green-600' },
    { label: 'En attente', value: locations.filter(l => l.status === 'PENDING').length, icon: AlertCircle, color: 'text-yellow-600' },
    { label: 'Confirmées', value: locations.filter(l => l.status === 'CONFIRMED').length, icon: CheckCircle, color: 'text-blue-600' },
    { label: 'Total du mois', value: `${locations.reduce((sum, l) => sum + Number(l.totalPrice || 0), 0).toLocaleString()} FCFA`, icon: Euro, color: 'text-purple-600' },
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

export default function MesLocationsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { 
    locationsWithDetails, 
    isLoading, 
    error, 
    getLocationsByUser 
  } = useLocations();
  
  const [activeTab, setActiveTab] = useState('toutes');

  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/client/locations');
    }
  }, [isAuthenticated, router]);

  // Chargement des locations au montage
  useEffect(() => {
    if (user?.id) {
      getLocationsByUser(user.id);
    }
  }, [user?.id, getLocationsByUser]);

  // Affichage de chargement
  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement de vos locations...</span>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => user?.id && getLocationsByUser(user.id)}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Filtrage des locations selon l'onglet actif
  const filteredLocations = locationsWithDetails.filter((location) => {
    switch (activeTab) {
      case 'en-cours':
        return location.status === 'ACTIVE';
      case 'a-venir':
        return location.status === 'CONFIRMED' && new Date(location.startDate) > new Date();
      case 'en-attente':
        return location.status === 'PENDING';
      case 'terminees':
        return location.status === 'COMPLETED';
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes Locations</h1>
        <p className="text-gray-600 mt-1">
          Gérez vos locations de matériel BTP en cours et à venir
        </p>
      </div>

      {/* Statistiques */}
      <LocationsStats locations={locationsWithDetails} />

      {/* Onglets et contenu */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="toutes">Toutes</TabsTrigger>
          <TabsTrigger value="en-cours">En cours</TabsTrigger>
          <TabsTrigger value="a-venir">À venir</TabsTrigger>
          <TabsTrigger value="en-attente">En attente</TabsTrigger>
          <TabsTrigger value="terminees">Terminées</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredLocations.length > 0 ? (
            <div className="space-y-4">
              {filteredLocations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  Aucune location {activeTab === 'toutes' ? '' : activeTab.replace('-', ' ')}
                </h3>
                <p className="text-gray-500 mb-4">
                  Vous n&apos;avez pas encore de locations dans cette catégorie.
                </p>
                <Button asChild>
                  <Link href="/client/catalogue">Parcourir le catalogue</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
