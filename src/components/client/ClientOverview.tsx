"use client";

import Link from 'next/link';
import { 
  Package, 
  Calendar, 
  Euro, 
  TrendingUp, 
  Clock, 
  Plus,
  MessageSquare,
  ArrowRight,
  Truck,
  Settings,
  BarChart3,
  CheckCircle,
  XCircle,
  Timer,
} from 'lucide-react';

// Types
interface Location {
  id: string;
  materiel: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  prix: number;
  statut: 'en-cours' | 'a-venir' | 'en-attente' | 'terminee';
  image?: string;
}

interface Stats {
  totalDepense: number;
  locationsActives: number;
  prochainePaiement: number;
  tempsRestant: number;
}

// Mock data
const mockLocations: Location[] = [
  {
    id: '1',
    materiel: 'Grue mobile 25T',
    type: 'Grue',
    dateDebut: '2025-01-15',
    dateFin: '2025-02-15',
    prix: 2500,
    statut: 'en-cours',
  },
  {
    id: '2',
    materiel: 'Nacelle 18m',
    type: 'Nacelle',
    dateDebut: '2025-01-20',
    dateFin: '2025-01-25',
    prix: 450,
    statut: 'en-cours',
  },
  {
    id: '3',
    materiel: 'Téléscopique 10m',
    type: 'Téléscopique',
    dateDebut: '2025-02-01',
    dateFin: '2025-02-10',
    prix: 800,
    statut: 'a-venir',
  },
];

const mockStats: Stats = {
  totalDepense: 15750,
  locationsActives: 2,
  prochainePaiement: 1200,
  tempsRestant: 15,
};

// Utilitaires
const getStatusColor = (statut: Location['statut']) => {
  switch (statut) {
    case 'en-cours':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    case 'a-venir':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    case 'en-attente':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    case 'terminee':
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
  }
};

const getStatusIcon = (statut: Location['statut']) => {
  switch (statut) {
    case 'en-cours':
      return <CheckCircle className="w-4 h-4" />;
    case 'a-venir':
      return <Clock className="w-4 h-4" />;
    case 'en-attente':
      return <Timer className="w-4 h-4" />;
    case 'terminee':
      return <XCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};

export function ClientOverview() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">
              Bonjour Ahmed ! 👋
            </h2>
            <p className="text-orange-100 text-lg">
              Vous avez <span className="font-semibold">{mockStats.locationsActives} locations actives</span> et 
              <span className="font-semibold"> {mockStats.tempsRestant} jours</span> avant votre prochaine échéance.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <Truck className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Locations actives
              </p>
              <p className="text-2xl font-bold text-foreground">
                {mockStats.locationsActives}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Dépense totale 2025
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(mockStats.totalDepense)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Euro className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Prochaine échéance
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(mockStats.prochainePaiement)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Temps restant
              </p>
              <p className="text-2xl font-bold text-foreground">
                {mockStats.tempsRestant}j
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Locations en cours */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Locations en cours
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Matériel actuellement loué
                  </p>
                </div>
                <Link
                  href="/client/locations"
                  className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1"
                >
                  Voir tout
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockLocations.filter(l => l.statut === 'en-cours').map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {location.materiel}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(location.dateDebut)} - {formatDate(location.dateFin)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatPrice(location.prix)}
                      </p>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(location.statut)}`}>
                        {getStatusIcon(location.statut)}
                        En cours
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Actions rapides
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <Link
                href="/client/catalogue"
                className="w-full flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">
                    Nouvelle location
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Parcourir le catalogue
                  </p>
                </div>
              </Link>

              <Link
                href="/client/locations"
                className="w-full flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">
                    Prolonger location
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Étendre la durée
                  </p>
                </div>
              </Link>

              <Link
                href="/client/support"
                className="w-full flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">
                    Contacter support
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Aide et assistance
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Mes statistiques
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Économies ce mois
                  </span>
                </div>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +15%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">
                    Matériel préféré
                  </span>
                </div>
                <span className="font-semibold text-foreground">
                  Grues
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">
                    Durée moyenne
                  </span>
                </div>
                <span className="font-semibold text-foreground">
                  12 jours
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prochaines échéances */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Prochaines échéances
              </h3>
              <p className="text-sm text-muted-foreground">
                Locations à venir et paiements
              </p>
            </div>
            <Link
              href="/client/billing"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1"
            >
              Voir factures
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockLocations.filter(l => l.statut === 'a-venir').map((location) => (
              <div key={location.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {location.materiel}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Début: {formatDate(location.dateDebut)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {formatPrice(location.prix)}
                  </p>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(location.statut)}`}>
                    {getStatusIcon(location.statut)}
                    À venir
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
