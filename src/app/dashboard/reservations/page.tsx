'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReservations } from '@/hooks/api/useReservations';
import { LocationStatus } from '@/types';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar,
  Search,
  Filter,
  MoreVertical,
  MapPin,
  Clock,
  Euro,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Edit3,
  X
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';

// Fonction pour obtenir le style du badge selon le statut
const getStatusBadge = (status: LocationStatus) => {
  const statusConfig = {
    PENDING: { label: 'En attente', variant: 'secondary' as const, icon: Clock },
    CONFIRMED: { label: 'Confirmée', variant: 'default' as const, icon: Calendar },
    ACTIVE: { label: 'En cours', variant: 'default' as const, icon: MapPin },
    COMPLETED: { label: 'Terminée', variant: 'outline' as const, icon: Calendar },
    CANCELLED: { label: 'Annulée', variant: 'destructive' as const, icon: X },
  };

  return statusConfig[status] || statusConfig.PENDING;
};

export default function MesReservationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { reservations, fetchReservations, isLoading, error } = useReservations();

  // État local
  const [filteredReservations, setFilteredReservations] = useState(reservations);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LocationStatus | 'ALL'>('ALL');

  // Charger les réservations de l'utilisateur
  useEffect(() => {
    const loadUserReservations = async () => {
      if (!isAuthenticated || !user) return;

      try {
        await fetchReservations({ userId: user.id });
      } catch (err) {
        console.error('Erreur lors du chargement des réservations:', err);
      }
    };

    loadUserReservations();
  }, [isAuthenticated, user, fetchReservations]);

  // Filtrer les réservations selon la recherche et le statut
  useEffect(() => {
    let filtered = reservations;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(reservation =>
        reservation.materiel?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par statut
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, statusFilter]);

  // Rediriger si pas authentifié
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Connexion requise
          </h1>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour voir vos réservations
          </p>
          <Button asChild>
            <Link href="/auth/login">Se connecter</Link>
          </Button>
        </div>
      </div>
    );
  }

  // État de chargement
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Chargement de vos réservations...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mes réservations
            </h1>
            <p className="text-gray-600">
              Gérez et suivez toutes vos locations de matériel
            </p>
          </div>

        {/* Filtres et recherche */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un matériel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre par statut */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as LocationStatus | 'ALL')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="PENDING">En attente</option>
                  <option value="CONFIRMED">Confirmées</option>
                  <option value="ACTIVE">En cours</option>
                  <option value="COMPLETED">Terminées</option>
                  <option value="CANCELLED">Annulées</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des réservations */}
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune réservation trouvée
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Aucune réservation ne correspond à vos critères de recherche'
                  : 'Vous n\'avez pas encore de réservation'
                }
              </p>
              {!searchTerm && statusFilter === 'ALL' && (
                <Button asChild>
                  <Link href="/materiels">Découvrir nos matériels</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => {
              const statusConfig = getStatusBadge(reservation.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Informations principales */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {/* Image du matériel */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <ImageWithFallback
                              src={reservation.materiel?.images?.[0]}
                              alt={reservation.materiel?.name || 'Matériel'}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              fallbackIcon="construction"
                              size="small"
                            />
                          </div>

                          {/* Détails */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {reservation.materiel?.name || 'Matériel inconnu'}
                              </h3>
                              <Badge variant={statusConfig.variant} className="flex-shrink-0">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(reservation.startDate), 'dd MMM yyyy', { locale: fr })} - {format(new Date(reservation.endDate), 'dd MMM yyyy', { locale: fr })}
                              </div>
                              
                              <div className="hidden sm:block text-gray-300">•</div>
                              
                              <div className="flex items-center gap-1 font-medium text-primary">
                                <Euro className="h-4 w-4" />
                                {formatPrice(Number(reservation.totalPrice))}
                              </div>
                            </div>

                            {reservation.notes && (
                              <p className="mt-2 text-sm text-gray-600 truncate">
                                {reservation.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/reservations/${reservation.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Link>
                        </Button>
                        
                        {reservation.status === 'PENDING' && (
                          <Button variant="outline" size="sm">
                            <Edit3 className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Action flottante pour nouvelle réservation */}
        {filteredReservations.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <Button asChild size="lg" className="rounded-full shadow-lg">
              <Link href="/materiels">
                <Search className="h-4 w-4 mr-2" />
                Nouvelle réservation
              </Link>
            </Button>
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}
