'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoices } from '@/hooks/api/useInvoices';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Download,
  Eye,
  Send,
  Euro,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatPrice } from '@/lib/utils';
import { InvoiceStatus } from '@/types';
import Link from 'next/link';

// Fonction pour obtenir le style du badge selon le statut
const getStatusBadge = (status: InvoiceStatus) => {
  const statusConfig = {
    DRAFT: { label: 'Brouillon', variant: 'secondary' as const, icon: FileText },
    PENDING: { label: 'En attente', variant: 'default' as const, icon: Clock },
    PAID: { label: 'Payée', variant: 'default' as const, icon: CheckCircle },
    OVERDUE: { label: 'En retard', variant: 'destructive' as const, icon: AlertCircle },
    CANCELLED: { label: 'Annulée', variant: 'outline' as const, icon: XCircle },
  };

  return statusConfig[status] || statusConfig.PENDING;
};

export default function FacturesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { invoices, fetchInvoices, isLoading, error, paidAmount } = useInvoices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);

  // Calculer les statistiques basées sur les factures
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING').length;

  // Charger les factures au montage
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchInvoices();
    }
  }, [isAuthenticated, user, fetchInvoices]);

  // Filtrer les factures selon la recherche et le statut
  useEffect(() => {
    let filtered = invoices;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.user?.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par statut
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  // Rediriger si pas authentifié
  if (!authLoading && !isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion requise
            </h1>
            <p className="text-gray-600 mb-6">
              Vous devez être connecté pour voir les factures
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // État de chargement
  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Chargement des factures...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Erreur de chargement
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => fetchInvoices()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Facturation
            </h1>
            <p className="text-gray-600">
              Gérez vos factures et suivez vos paiements
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d&apos;affaires</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(paidAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  Total des factures payées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Factures payées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  Factures réglées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  Factures impayées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total factures</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoices.length}</div>
                <p className="text-xs text-muted-foreground">
                  Toutes les factures
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres et recherche */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Recherche */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="N° de facture, client..."
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
                    onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="DRAFT">Brouillons</option>
                    <option value="PENDING">En attente</option>
                    <option value="PAID">Payées</option>
                    <option value="OVERDUE">En retard</option>
                    <option value="CANCELLED">Annulées</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des factures */}
          <Card>
            <CardHeader>
              <CardTitle>Factures ({filteredInvoices.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune facture trouvée
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || statusFilter !== 'ALL' 
                      ? 'Aucune facture ne correspond à vos critères de recherche'
                      : 'Aucune facture n\'a encore été créée'
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Facture</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const statusConfig = getStatusBadge(invoice.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{invoice.user?.name}</div>
                              {invoice.user?.company && (
                                <div className="text-sm text-gray-600">{invoice.user.company}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.issueDate), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(Number(invoice.totalAmount))}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={statusConfig.variant}
                              className={invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : ''}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/factures/${invoice.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </Link>
                              </Button>
                              
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </Button>
                              
                              {invoice.status === 'PENDING' && (
                                <Button variant="outline" size="sm">
                                  <Send className="h-4 w-4 mr-2" />
                                  Envoyer
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
