// Page de réservation d'un matériel
// Les clients peuvent sélectionner les dates et confirmer leur location

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMaterials } from '@/hooks/api/useMaterials';
import { useLocations } from '@/hooks/api/useLocations';
import { useAuth } from '@/contexts/AuthContext';
import { Materiel, CreateLocationRequest, Location } from '@/types';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  Calculator,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  Info,
  Eye
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { format, differenceInDays, isBefore, startOfDay, isAfter, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';

export default function LouerMaterielPage() {
  const params = useParams();
  const router = useRouter();
  const materielId = params.id as string;

  // Hooks pour l'authentification
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Hooks pour la gestion des matériels et locations
  const { getMaterial, isLoading: loadingMaterial, error: materialError } = useMaterials();
  const { 
    createLocation, 
    isLoading: creatingLocation, 
    error: locationError,
    getLocationsByMaterial 
  } = useLocations();

  // État local pour le matériel
  const [materiel, setMateriel] = useState<Materiel | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState<Date | null>(null);

  // État local pour le formulaire de réservation
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // État pour les calculs de prix
  const [totalDays, setTotalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // État pour la validation
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // Charger les détails du matériel et ses locations
  useEffect(() => {
    const loadMaterialData = async () => {
      if (!materielId) return;

      try {
        setIsLoading(true);
        
        // Charger le matériel avec une gestion explicite des erreurs
        try {
          const materialData = await getMaterial(materielId);
          setMateriel(materialData);

          // Si le matériel est loué, essayer de charger ses locations pour déterminer la disponibilité
          if (materialData && materialData.status === 'RENTED') {
            // Utiliser un bloc try-catch séparé pour isoler les erreurs de getLocationsByMaterial
            try {
              const response = await getLocationsByMaterial(materielId);
              if (Array.isArray(response) && response.length > 0) {
                const availDate = calculateAvailabilityDate(response);
                if (availDate) {
                  setAvailabilityDate(availDate);
                  setStartDate(availDate);
                } else {
                  // Fallback: date par défaut à +7 jours
                  const defaultAvailDate = addDays(new Date(), 7);
                  setAvailabilityDate(defaultAvailDate);
                  setStartDate(defaultAvailDate);
                }
              } else {
                // Aucune location active trouvée, mais le statut est RENTED
                const defaultAvailDate = addDays(new Date(), 7);
                setAvailabilityDate(defaultAvailDate);
                setStartDate(defaultAvailDate);
              }
            } catch (locErr) {
              // Gérer silencieusement les erreurs de l'API de locations
              console.warn('Impossible de charger les locations (API non disponible):', locErr);
              const defaultAvailDate = addDays(new Date(), 7);
              setAvailabilityDate(defaultAvailDate);
              setStartDate(defaultAvailDate);
            }
          } else if (materialData && materialData.status === 'AVAILABLE') {
            // Si le matériel est disponible, définir la date de début à aujourd'hui
            setStartDate(new Date());
          }
        } catch (matErr) {
          console.error('Erreur lors du chargement du matériel:', matErr);
          setErrors({material: matErr instanceof ApiError ? matErr.message : 'Erreur lors du chargement du matériel'});
        }
      } catch (err) {
        console.error('Erreur générale lors du chargement des données:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMaterialData();
  }, [materielId, getMaterial, getLocationsByMaterial]);

  // Calculer le prix total quand les dates changent
  useEffect(() => {
    if (startDate && endDate && materiel) {
      const days = differenceInDays(endDate, startDate) + 1; // +1 pour inclure le jour de début
      setTotalDays(Math.max(1, days)); // Au minimum 1 jour
      setTotalPrice(Math.max(1, days) * Number(materiel.pricePerDay));
    } else {
      setTotalDays(0);
      setTotalPrice(0);
    }
  }, [startDate, endDate, materiel]);

  // Rediriger vers la connexion si pas authentifié (après le chargement)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/materiels/${materielId}/louer`);
    }
  }, [authLoading, isAuthenticated, router, materielId]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!startDate) {
      newErrors.startDate = 'La date de début est requise';
    } else {
      // Si le matériel est loué et qu'une date de disponibilité existe,
      // vérifier que la date de début n'est pas avant cette date
      if (materiel?.status === 'RENTED' && availabilityDate) {
        if (isBefore(startDate, availabilityDate)) {
          newErrors.startDate = `La date de début ne peut pas être avant le ${format(availabilityDate, 'dd MMMM yyyy', { locale: fr })} (date de disponibilité)`;
        }
      } else if (isBefore(startDate, startOfDay(new Date()))) {
        // Sinon, vérifier simplement que ce n'est pas dans le passé
        newErrors.startDate = 'La date de début ne peut pas être dans le passé';
      }
    }

    if (!endDate) {
      newErrors.endDate = 'La date de fin est requise';
    } else if (startDate && isBefore(endDate, startDate)) {
      newErrors.endDate = 'La date de fin doit être après la date de début';
    }

    if (totalDays > 30) {
      newErrors.duration = 'La durée maximale de location est de 30 jours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !startDate || !endDate || !materiel) {
      return;
    }

    // Vérifier que l'utilisateur est authentifié
    if (!isAuthenticated || !user) {
      router.push(`/auth/login?redirect=/materiels/${materielId}/louer`);
      return;
    }

    const locationRequest: CreateLocationRequest = {
      materielId: materiel.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      notes: notes.trim() || undefined,
    };

    try {
      setIsLoading(true);
      try {
        await createLocation(locationRequest);
        
        // Rediriger vers une page de confirmation
        router.push(`/reservations/confirmation?materiel=${materiel.name}&total=${totalPrice}`);
      } catch (apiErr) {
        // Gérer spécifiquement l'erreur 404 (endpoint pas encore implémenté)
        if (apiErr instanceof ApiError && apiErr.status === 404) {
          console.warn('API de location non disponible:', apiErr.message);
          setErrors({submit: "L'API de réservation n'est pas encore disponible. Veuillez réessayer plus tard ou contacter le support."});
        } else {
          console.error('Erreur lors de la création de la location:', apiErr);
          setErrors({submit: apiErr instanceof ApiError ? apiErr.message : 'Erreur lors de la création de la location'});
        }
      }
    } catch (err) {
      console.error('Erreur générale lors de la soumission:', err);
      setErrors({submit: 'Une erreur inattendue est survenue. Veuillez réessayer.'});
    } finally {
      setIsLoading(false);
    }
  };

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
        icon: Info,
        color: 'text-red-600'
      },
      OUT_OF_ORDER: { 
        label: 'Hors service', 
        variant: 'destructive' as const,
        icon: AlertCircle,
        color: 'text-red-600'
      },
    };

    return statusMap[status as keyof typeof statusMap] || 
           { label: status, variant: 'outline' as const, icon: Info, color: 'text-gray-600' };
  };

  // États de chargement et d'erreur
  if (isLoading || loadingMaterial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (materialError || !materiel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 mb-6">
            {materialError || "Le matériel demandé n'a pas été trouvé"}
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

  // Vérifier si le matériel est en maintenance ou hors service
  if (materiel.status !== 'AVAILABLE' && materiel.status !== 'RENTED') {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Ce matériel n&apos;est pas disponible à la location
            </h1>
            <p className="text-gray-600 mb-6">
              Ce matériel est actuellement {getStatusInfo(materiel.status).label.toLowerCase()}.
              Veuillez consulter notre catalogue pour d&apos;autres options.
            </p>
            <Button asChild variant="outline">
              <Link href="/materiels">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la liste
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isRented = materiel.status === 'RENTED';
  const disabledDates = {
    before: isRented && availabilityDate ? availabilityDate : startOfDay(new Date())
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/materiels/${materielId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux détails
            </Link>
          </Button>
        </div>

        {isRented && availabilityDate && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
              <div>
                <p className="text-amber-800 font-medium">
                  Matériel actuellement loué
                </p>
                <p className="text-amber-700 text-sm">
                  Ce matériel n&apos;est disponible qu&apos;à partir du {format(availabilityDate, 'dd MMMM yyyy', { locale: fr })}.
                  Votre date de début a été automatiquement ajustée à cette date.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Réserver {materiel.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Informations matériel */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    {materiel.images && materiel.images.length > 0 ? (
                      <Image
                        src={materiel.images[0]}
                        alt={materiel.name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover w-12 h-12"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                        <Eye className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {materiel.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatPrice(Number(materiel.pricePerDay))} / jour
                      </p>
                    </div>
                  </div>
                  <Badge variant={isRented ? "secondary" : "default"}>
                    {isRented ? "Réservation future" : "Disponible"}
                  </Badge>
                </div>

                {/* Sélection des dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date de début */}
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Date de début</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="start-date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground",
                            errors.startDate && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? (
                            format(startDate, "dd MMMM yyyy", { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={disabledDates}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && (
                      <p className="text-sm text-red-500">{errors.startDate}</p>
                    )}
                  </div>

                  {/* Date de fin */}
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Date de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="end-date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground",
                            errors.endDate && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? (
                            format(endDate, "dd MMMM yyyy", { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={{
                            before: startDate || (isRented && availabilityDate ? availabilityDate : startOfDay(new Date()))
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {errors.duration && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {errors.duration}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes spéciales (optionnel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informations supplémentaires pour votre réservation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                {/* Récapitulatif */}
                {startDate && endDate && totalDays > 0 && (
                  <div className="bg-gray-50 p-4 rounded-md space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Durée de location:
                      </span>
                      <span className="text-sm text-gray-900">
                        {totalDays} jour{totalDays > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Prix par jour:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formatPrice(Number(materiel.pricePerDay))}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">
                        Total:
                      </span>
                      <span className="font-bold text-xl text-primary">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/materiels/${materielId}`)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={creatingLocation}
                    className="gap-2"
                  >
                    {creatingLocation ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4" />
                        {isRented ? "Réserver" : "Louer maintenant"}
                      </>
                    )}
                  </Button>
                </div>

                {(locationError || errors.submit) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mt-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <p className="font-medium">Erreur lors de la réservation</p>
                        <p className="text-sm">{errors.submit || locationError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
