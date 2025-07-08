// Page de réservation d'un matériel
// Les clients peuvent sélectionner les dates et confirmer leur location

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMaterials } from '@/hooks/api/useMaterials';
import { useLocations } from '@/hooks/api/useLocations';
import { useAuth } from '@/contexts/AuthContext';
import { Materiel, CreateLocationRequest } from '@/types';
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
  Euro
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { format, differenceInDays, isBefore, startOfDay } from 'date-fns';
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
  const { createLocation, isLoading: creatingLocation, error: locationError } = useLocations();

  // État local pour le matériel
  const [materiel, setMateriel] = useState<Materiel | null>(null);

  // État local pour le formulaire de réservation
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // État pour les calculs de prix
  const [totalDays, setTotalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // État pour la validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les détails du matériel
  useEffect(() => {
    const loadMaterial = async () => {
      if (!materielId) return;

      try {
        const materialData = await getMaterial(materielId);
        setMateriel(materialData);
      } catch (err) {
        console.error('Erreur lors du chargement du matériel:', err);
      }
    };

    loadMaterial();
  }, [materielId, getMaterial]);

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
    } else if (isBefore(startDate, startOfDay(new Date()))) {
      newErrors.startDate = 'La date de début ne peut pas être dans le passé';
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
      await createLocation(locationRequest);
      
      // Rediriger vers une page de confirmation
      router.push(`/reservations/confirmation?materiel=${materiel.name}&total=${totalPrice}`);
    } catch (err) {
      console.error('Erreur lors de la création de la location:', err);
    }
  };

  // États de chargement et d'erreur
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Vérification de l&apos;authentification...</p>
        </div>
      </div>
    );
  }

  if (loadingMaterial && !materiel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Chargement du matériel...</p>
        </div>
      </div>
    );
  }

  if (materialError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 mb-6">{materialError}</p>
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

  if (!materiel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Matériel non trouvé
          </h1>
          <p className="text-gray-600 mb-6">
            Le matériel demandé n&apos;existe pas ou n&apos;est plus disponible.
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

  if (materiel.status !== 'AVAILABLE') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Matériel non disponible
          </h1>
          <p className="text-gray-600 mb-6">
            Ce matériel n&apos;est actuellement pas disponible à la location.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href={`/materiels/${materiel.id}`}>
                Voir les détails
              </Link>
            </Button>
            <Button asChild>
              <Link href="/materiels">
                Autres matériels
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/materiels/${materiel.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux détails
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Réserver : {materiel.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Sélectionnez vos dates de location et confirmez votre réservation
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Récapitulatif du matériel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Matériel sélectionné</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {materiel.images && materiel.images[0] ? (
                      <Image
                        src={materiel.images[0]}
                        alt={materiel.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CalendarIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{materiel.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{materiel.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Disponible
                      </Badge>
                      <span className="text-sm text-gray-600">•</span>
                      <span className="text-sm font-medium text-primary">
                        {formatPrice(Number(materiel.pricePerDay))} / jour
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calcul du prix */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calcul du prix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {totalDays > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Prix par jour:</span>
                      <span className="font-medium">{formatPrice(Number(materiel.pricePerDay))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Nombre de jours:</span>
                      <span className="font-medium">{totalDays} jour{totalDays > 1 ? 's' : ''}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary flex items-center gap-1">
                        <Euro className="h-5 w-5" />
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Sélectionnez vos dates pour voir le prix
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de réservation */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Détails de la réservation</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Sélection des dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date de début */}
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Date de début</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground",
                              errors.startDate && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? (
                              format(startDate, "PPP", { locale: fr })
                            ) : (
                              "Choisir une date"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            disabled={(date: Date) => isBefore(date, startOfDay(new Date()))}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.startDate && (
                        <p className="text-sm text-red-600">{errors.startDate}</p>
                      )}
                    </div>

                    {/* Date de fin */}
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Date de fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground",
                              errors.endDate && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? (
                              format(endDate, "PPP", { locale: fr })
                            ) : (
                              "Choisir une date"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date: Date) => {
                              if (startDate) {
                                return isBefore(date, startDate) || 
                                       isBefore(date, startOfDay(new Date())) ||
                                       differenceInDays(date, startDate) > 30;
                              }
                              return isBefore(date, startOfDay(new Date()));
                            }}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.endDate && (
                        <p className="text-sm text-red-600">{errors.endDate}</p>
                      )}
                    </div>
                  </div>

                  {/* Erreur de durée */}
                  {errors.duration && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{errors.duration}</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Informations supplémentaires sur votre projet..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Erreurs de location */}
                  {locationError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-red-700">{locationError}</p>
                      </div>
                    </div>
                  )}

                  {/* Bouton de soumission */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={creatingLocation || !startDate || !endDate || totalPrice === 0}
                  >
                    {creatingLocation ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Confirmation en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmer la réservation
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    En confirmant, vous acceptez nos conditions de location
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
