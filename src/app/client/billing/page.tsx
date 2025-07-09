'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoices } from '@/hooks/api/useInvoices';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Download,
  Euro,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Receipt,
  Loader2,
  XCircle,
} from 'lucide-react';
import { InvoiceStatus } from '@/types';

// Configuration des statuts
const statusConfig = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: FileText },
  PENDING: { label: 'En attente', color: 'bg-blue-100 text-blue-800', icon: Clock },
  PAID: { label: 'Payée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  CANCELLED: { label: 'Annulée', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

// Interface pour une facture simplifiée basée sur le hook
interface SimpleInvoice {
  id: string;
  number: string;
  userId: string;
  status: InvoiceStatus;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  items?: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  payments?: {
    id: string;
    amount: number;
    method: string;
    status: string;
    createdAt: Date;
  }[];
}

function FactureCard({ invoice }: { invoice: SimpleInvoice }) {
  const config = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.DRAFT;
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {invoice.number}
            </h3>
            <p className="text-sm text-gray-500">
              Émise le {invoice.issueDate.toLocaleDateString('fr-FR')}
            </p>
          </div>
          <Badge className={config.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        {/* Description */}
        {invoice.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">{invoice.description}</p>
          </div>
        )}

        {/* Détails des items */}
        {invoice.items && invoice.items.length > 0 && (
          <div className="space-y-2 mb-4">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.description} × {item.quantity}
                </span>
                <span className="font-medium">
                  {item.totalPrice.toLocaleString()} FCFA
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Informations de paiement */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Date d&apos;échéance</span>
            <span className="text-sm font-medium">
              {invoice.dueDate.toLocaleDateString('fr-FR')}
            </span>
          </div>
          
          {invoice.paidDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payée le</span>
              <span className="text-sm">{invoice.paidDate.toLocaleDateString('fr-FR')}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">Total</span>
            <span className="font-semibold text-lg text-green-600">
              {invoice.totalAmount.toLocaleString()} FCFA
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-4 h-4 mr-1" />
            Voir détails
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="w-4 h-4 mr-1" />
            Télécharger
          </Button>
          {invoice.status === 'PENDING' && (
            <Button size="sm" className="flex-1">
              <CreditCard className="w-4 h-4 mr-1" />
              Payer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FacturationStats({ invoices }: { invoices: SimpleInvoice[] }) {
  const totalFactures = invoices.length;
  const facturesPaid = invoices.filter(f => f.status === 'PAID').length;
  const facturesPending = invoices.filter(f => f.status === 'PENDING').length;
  const facturesOverdue = invoices.filter(f => f.status === 'OVERDUE').length;
  const totalPaid = invoices
    .filter(f => f.status === 'PAID')
    .reduce((sum, f) => sum + f.totalAmount, 0);
  const totalPending = invoices
    .filter(f => f.status !== 'PAID')
    .reduce((sum, f) => sum + f.totalAmount, 0);

  const stats = [
    { label: 'Total factures', value: totalFactures, icon: FileText, color: 'text-blue-600' },
    { label: 'Payées', value: facturesPaid, icon: CheckCircle, color: 'text-green-600' },
    { label: 'En attente', value: facturesPending, icon: Clock, color: 'text-yellow-600' },
    { label: 'En retard', value: facturesOverdue, icon: AlertCircle, color: 'text-red-600' },
  ];

  const financial = [
    { label: 'Montant payé', value: `${totalPaid.toLocaleString()} FCFA`, icon: Euro, color: 'text-green-600' },
    { label: 'En attente', value: `${totalPending.toLocaleString()} FCFA`, icon: Euro, color: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {financial.map((stat, index) => {
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
                    <p className="text-xl font-semibold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function FacturationPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { 
    invoices, 
    isLoading, 
    error, 
    fetchInvoices,
  } = useInvoices();

  // État local
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('toutes');

  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/client/billing');
    }
  }, [isAuthenticated, router]);

  // Charger les factures de l'utilisateur
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchInvoices({ 
        userId: user.id,
        status: activeTab !== 'toutes' ? (activeTab.toUpperCase() as InvoiceStatus) : undefined 
      });
    }
  }, [isAuthenticated, user, fetchInvoices, activeTab]);

  // Filtrer les factures selon la recherche
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.items?.some(item => 
                           item.description.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    return matchesSearch;
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => fetchInvoices({ userId: user?.id })}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
        <p className="text-gray-600 mt-1">
          Gérez vos factures et suivez vos paiements
        </p>
      </div>

      {/* Statistiques */}
      <FacturationStats invoices={filteredInvoices} />

      {/* Recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher par numéro de facture ou matériel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Onglets et factures */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="toutes">Toutes</TabsTrigger>
          <TabsTrigger value="paid">Payées</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="overdue">En retard</TabsTrigger>
          <TabsTrigger value="cancelled">Annulées</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredInvoices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvoices.map((invoice) => (
                <FactureCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  Aucune facture trouvée
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? "Essayez de modifier votre recherche."
                    : `Vous n'avez pas encore de factures ${activeTab === 'toutes' ? '' : activeTab.replace('_', ' ')}.`
                  }
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                  >
                    Effacer la recherche
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
