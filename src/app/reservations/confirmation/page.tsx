'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Calendar, 
  FileText, 
  ArrowRight, 
  Home,
  Clock
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const materielName = searchParams.get('materiel');
  const totalPrice = searchParams.get('total');

  // Rediriger si les paramètres sont manquants
  useEffect(() => {
    if (!materielName || !totalPrice) {
      router.push('/materiels');
    }
  }, [materielName, totalPrice, router]);

  if (!materielName || !totalPrice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête de confirmation */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Réservation confirmée !
          </h1>
          <p className="text-lg text-gray-600">
            Votre demande de location a été enregistrée avec succès
          </p>
        </div>

        {/* Détails de la réservation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détails de votre réservation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Matériel */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Matériel réservé</p>
                <p className="font-medium">{materielName}</p>
              </div>
              <Badge variant="secondary">
                <Calendar className="h-3 w-3 mr-1" />
                En attente
              </Badge>
            </div>

            <Separator />

            {/* Prix total */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Montant total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(Number(totalPrice))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Statut du paiement</p>
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  <Clock className="h-3 w-3 mr-1" />
                  En attente
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Informations importantes */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                Prochaines étapes
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Notre équipe va examiner votre demande</li>
                <li>• Vous recevrez une confirmation par email dans les 24h</li>
                <li>• Un devis détaillé vous sera envoyé</li>
                <li>• Le paiement sera requis avant la livraison</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="/materiels">
              Autres matériels
            </Link>
          </Button>
          
          <Button asChild className="flex-1 sm:flex-none">
            <Link href="/dashboard/reservations">
              Mes réservations
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          
          <Button asChild variant="ghost" className="flex-1 sm:flex-none">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Accueil
            </Link>
          </Button>
        </div>

        {/* Informations de contact */}
        <Card className="mt-8 bg-gray-100 border-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-2">
                Besoin d&apos;aide ?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Notre équipe est là pour vous accompagner
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline" size="sm">
                  <Link href="tel:+33123456789">
                    Appeler notre service
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="mailto:support@dagamaraka.com">
                    Envoyer un email
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
