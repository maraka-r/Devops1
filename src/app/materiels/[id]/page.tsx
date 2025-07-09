// Page détail d'un matériel spécifique
// Les clients peuvent voir les détails complets et procéder à la location

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMaterials } from '@/hooks/api/useMaterials';
import { useLocations } from '@/hooks/api/useLocations';
import { Materiel, Location } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  ArrowLeft, 
  Eye, 
  Clock, 
  Info, 
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { cn } from '@/lib/utils';
import { format, addDays, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composant pour afficher les spécifications techniques
const SpecificationsDisplay = ({ specifications }: { specifications: unknown }) => {
  if (!specifications || typeof specifications !== 'object') return null;

  const specs = specifications as Record<string, unknown>;

  return (
    <div className="space-y-3">
      {Object.entries(specs).map(([key, value]) => (
        <div key={key} className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}:
          </span>
          <span className="text-sm text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function MaterielDetailPage() {
  const params = useParams();
  const router = useRouter();
  const materielId = params.id as string;

  // Hooks pour la gestion des matériels et locations
  const { getMaterial, error, clearError } = useMaterials();
  const { getLocationsByMaterial } = useLocations();

  // État local
  const [materiel, setMateriel] = useState<Materiel | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour calculer la date de disponibilité à partir des locations actives
  const calculateAvailabilityDate = (locations: Location[]) => {
    if (!locations || locations.length === 0) return null;

    const activeLocations = locations.filter(
      loc => loc.status === 'ACTIVE' || loc.status === 'CONFIRMED'
    );

    if (activeLocations.length === 0) return null;

    // Trouver la date de fin la plus éloignée
    const latestEndDate = activeLocations.reduce((latest, loc) => {
      const endDate = new Date(loc.endDate);
      return isAfter(endDate, latest) ? endDate : latest;
    }, new Date(activeLocations[0].endDate));

    // Ajouter un jour pour la maintenance/nettoyage
    return addDays(latestEndDate, 1);
  };
  
  // Cette fonction a été remplacée par la logique directe dans le JSX
  // Nous gardons la logique de disponibilité simplifiée dans le rendu

  // Charger les détails du matériel et ses locations
  useEffect(() => {
    const loadMaterialData = async () => {
      if (!materielId) return;

      try {
        setIsLoading(true);
        // Charger le matériel
        const materialData = await getMaterial(materielId);
        setMateriel(materialData);

        // Si le matériel est loué, essayer de charger ses locations pour déterminer la disponibilité
        if (materialData && materialData.status === 'RENTED') {
          try {
            const response = await getLocationsByMaterial(materielId);
            // Vérifier si on a des locations et si oui, calculer la date de disponibilité
            if (Array.isArray(response) && response.length > 0) {
              const availDate = calculateAvailabilityDate(response);
              if (availDate) {
                setAvailabilityDate(availDate);
              } else {
                // Si on n'a pas pu déterminer une date à partir des locations
                const defaultAvailDate = addDays(new Date(), 7);
                setAvailabilityDate(defaultAvailDate);
              }
            } else {
              // Si pas de locations actives trouvées mais le statut est RENTED
              const defaultAvailDate = addDays(new Date(), 7);
              setAvailabilityDate(defaultAvailDate);
            }
          } catch (locErr) {
            console.warn('Impossible de charger les locations:', locErr);
            // Si on n'a pas pu charger les locations (404 ou autre erreur)
            // on définit une date par défaut de disponibilité à 7 jours
            const defaultAvailDate = addDays(new Date(), 7);
            setAvailabilityDate(defaultAvailDate);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMaterialData();
  }, [materielId, getMaterial, getLocationsByMaterial]);

  // Fonction pour formater le statut
  const getStatusInfo = (status: string) => {
    const statusMap = {
      AVAILABLE: { 
        label: 'Disponible', 
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600'
      },
      RENTED: { 
        label: 'Loué', 
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-orange-600'
      },
      MAINTENANCE: { 
        label: 'En maintenance', 
        variant: 'destructive' as const,
        icon: Settings,
        color: 'text-red-600'
      },
      OUT_OF_ORDER: { 
        label: 'Hors service', 
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-red-600'
      },
    };

    return statusMap[status as keyof typeof statusMap] || 
           { label: status, variant: 'outline' as const, icon: Info, color: 'text-gray-600' };
  };

  // Fonction pour formater le type de matériel
  const formatMaterialType = (type: string) => {
    const typeMap = {
      GRUE_MOBILE: 'Grue mobile',
      PELLETEUSE: 'Pelleteuse',
      NACELLE_CISEAUX: 'Nacelle ciseaux',
      NACELLE_TELESCOPIQUE: 'Nacelle télescopique',
      COMPACTEUR: 'Compacteur',
      CHARIOT_ELEVATEUR: 'Chariot élévateur',
      MARTEAU_PIQUEUR: 'Marteau piqueur',
    };

    return typeMap[type as keyof typeof typeMap] || type;
  };

  // États de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Chargement du matériel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={clearError}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!materiel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Matériel non trouvé
          </h1>
          <p className="text-gray-600 mb-6">
            Le matériel demandé n&apos;existe pas ou a été supprimé.
          </p>
          <Button asChild variant="outline">
            <Link href="/materiels">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(materiel.status);
  const StatusIcon = statusInfo.icon;
  const isAvailable = materiel.status === 'AVAILABLE';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/materiels">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la liste
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <StatusIcon className={cn("h-5 w-5", statusInfo.color)} />
              <Badge variant={statusInfo.variant}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images du matériel */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <ImageWithFallback
                    src={materiel.images?.[0]}
                    alt={materiel.name}
                    width={600}
                    height={400}
                    className="w-full h-full object-cover"
                    fallbackIcon="construction"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Images supplémentaires si disponibles */}
            {/* {materiel.images && materiel.images.length > 1 && (
              <div className="grid grid-cols-3 gap-4">
                {materiel.images.slice(1, 4).map((image, index) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={image}
                      alt={`${materiel.name} - ${index + 2}`}
                      width={200}
                      height={150}
                      className="w-full h-full object-cover"
                      fallbackIcon="construction"
                      size="small"
                    />
                  </div>
                ))}
              </div>
            )} */}
          </div>

          {/* Informations du matériel */}
          <div className="space-y-6">
            {/* Titre et prix */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {materiel.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(Number(materiel.pricePerDay))}
                </span>
                <span className="text-gray-600">/ jour</span>
              </div>
            </div>

            {/* Alerte de disponibilité si le matériel est loué */}
            {materiel.status === 'RENTED' && availabilityDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-amber-800 font-medium">
                      Matériel actuellement loué
                    </p>
                    <p className="text-amber-700 text-sm">
                      Disponible à partir du {format(availabilityDate, 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {materiel.description}
                </p>
              </CardContent>
            </Card>

            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Type:</span>
                    <p className="text-gray-900">{formatMaterialType(materiel.type)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Statut:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
                      <span className="text-gray-900">{statusInfo.label}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <span className="text-sm font-medium text-gray-600">Prix par jour:</span>
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(Number(materiel.pricePerDay))}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Spécifications techniques */}
            {materiel.specifications && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spécifications techniques</CardTitle>
                </CardHeader>
                <CardContent>
                  <SpecificationsDisplay specifications={materiel.specifications} />
                </CardContent>
              </Card>
            )}

            {/* Manuel d'utilisation */}
            {/* {materiel.manualUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <a 
                      href={materiel.manualUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Télécharger le manuel d&apos;utilisation
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )} */}

            {/* Actions */}
            <div className="space-y-4">
              {isAvailable ? (
                // Si le matériel est disponible immédiatement
                <Button asChild size="lg" className="w-full">
                  <Link href={`/materiels/${materiel.id}/louer`}>
                    <Calendar className="h-5 w-5 mr-2" />
                    Réserver ce matériel
                  </Link>
                </Button>
              ) : materiel.status === 'RENTED' ? (
                // Si le matériel est loué, permettre la réservation future qu'on connaisse ou non la date exacte
                <>
                  <Button asChild size="lg" className="w-full" variant="outline">
                    <Link href={`/materiels/${materiel.id}/louer`}>
                      <Calendar className="h-5 w-5 mr-2" />
                      Réserver pour plus tard
                    </Link>
                  </Button>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-800 font-medium">
                          Matériel actuellement loué
                        </p>
                        <p className="text-yellow-700 text-sm">
                          {availabilityDate ? (
                            <>Ce matériel est loué jusqu&apos;au {format(availabilityDate, 'dd MMMM yyyy', { locale: fr })}. 
                            Vous pouvez le réserver pour une utilisation après cette date.</>
                          ) : (
                            <>Ce matériel est actuellement loué. 
                            Vous pouvez le réserver pour une utilisation future.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Pour tout autre état (en maintenance, hors service)
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-800 font-medium">
                        Matériel non disponible
                      </p>
                      <p className="text-yellow-700 text-sm">
                        Ce matériel est actuellement {statusInfo.label.toLowerCase()}. 
                        Consultez notre catalogue pour d&apos;autres options.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/materiels">
                  Voir d&apos;autres matériels
                </Link>
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
