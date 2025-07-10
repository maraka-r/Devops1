// Hook pour la gestion des factures
// CRUD, recherche, changement de statut, paiements

'use client';

import { useState, useCallback } from 'react';
import { apiService } from '@/lib/api';
import { 
  InvoiceStatus,
  ApiResponse,
  PaginatedResponse
} from '@/types';

// Types simplifiés pour les factures
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

// Mock data pour développement
const mockInvoices: SimpleInvoice[] = [
  {
    id: 'invoice-1',
    number: 'FAC-2024-001',
    userId: 'user-1',
    status: 'PAID',
    totalAmount: 1080.00,
    taxAmount: 180.00,
    discountAmount: 0,
    issueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    paidDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    description: 'Location Grue mobile Liebherr LTM 1030-2.1',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    user: {
      id: 'user-1',
      name: 'Jean Martin',
      email: 'jean.martin@entreprise-martin.fr',
      company: 'Entreprise Martin',
    },
    items: [
      {
        id: 'item-1',
        description: 'Location grue mobile - 2 jours',
        quantity: 2,
        unitPrice: 450.00,
        totalPrice: 900.00,
      },
    ],
    payments: [
      {
        id: 'payment-1',
        amount: 1080.00,
        method: 'CARD',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: 'invoice-2',
    number: 'FAC-2024-002',
    userId: 'user-2',
    status: 'PENDING',
    totalAmount: 1680.00,
    taxAmount: 280.00,
    discountAmount: 0,
    issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    description: 'Location Pelleteuse Caterpillar 320D2',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    user: {
      id: 'user-2',
      name: 'Sophie Bernard',
      email: 'sophie.bernard@btp-solutions.fr',
      company: 'BTP Solutions',
    },
    items: [
      {
        id: 'item-2',
        description: 'Location pelleteuse - 5 jours',
        quantity: 5,
        unitPrice: 280.00,
        totalPrice: 1400.00,
      },
    ],
    payments: [],
  },
];

interface InvoiceFilters {
  status?: InvoiceStatus;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  overdue?: boolean;
  limit?: number;
  offset?: number;
}

interface CreateInvoiceRequest {
  userId: string;
  description?: string;
  notes?: string;
  dueDate: Date;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface UseInvoicesReturn {
  // État
  invoices: SimpleInvoice[];
  isLoading: boolean;
  error: string | null;
  
  // Statistiques
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueCount: number;
  
  // Actions CRUD
  fetchInvoices: (filters?: InvoiceFilters) => Promise<void>;
  getInvoice: (id: string) => Promise<SimpleInvoice | null>;
  createInvoice: (data: CreateInvoiceRequest) => Promise<SimpleInvoice>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<SimpleInvoice>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Actions spécifiques
  getOverdueInvoices: () => Promise<void>;
  getPendingInvoices: () => Promise<void>;
  markAsPaid: (id: string) => Promise<SimpleInvoice>;
  sendInvoice: (id: string) => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  refreshInvoices: () => Promise<void>;
}

export function useInvoices(): UseInvoicesReturn {
  // État local
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculs dérivés
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const overdueCount = invoices.filter(inv => 
    inv.status === 'PENDING' && new Date(inv.dueDate) < new Date()
  ).length;

  // Fonction pour nettoyer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fonction pour récupérer les factures
  const fetchInvoices = useCallback(async (filters: InvoiceFilters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.get<ApiResponse<SimpleInvoice[] | PaginatedResponse<SimpleInvoice>>>('/api/invoices', {
        params: filters as Record<string, string | number | boolean>,
      });

      // Gérer différents formats de réponse (direct array, data property, ou pagination)
      if (Array.isArray(response.data)) {
        setInvoices(response.data as SimpleInvoice[]);
      } else if (response.data && 'data' in response.data) {
        // Format ApiResponse avec data: SimpleInvoice[]
        if (Array.isArray(response.data.data)) {
          setInvoices(response.data.data as SimpleInvoice[]);
        } 
        // Format ApiResponse avec data: { data: SimpleInvoice[] } (pagination)
        else if (response.data.data && 'data' in response.data.data) {
          setInvoices((response.data.data as PaginatedResponse<SimpleInvoice>).data);
        }
      }

    } catch {
      console.log('API non disponible, utilisation des mocks pour les factures');
      
      // Fallback sur les mocks avec filtrage
      let filteredMocks = mockInvoices;
      
      if (filters.status) {
        filteredMocks = mockInvoices.filter(inv => inv.status === filters.status);
      }
      
      if (filters.userId) {
        filteredMocks = filteredMocks.filter(inv => inv.userId === filters.userId);
      }
      
      if (filters.overdue) {
        filteredMocks = filteredMocks.filter(inv => 
          inv.status === 'PENDING' && new Date(inv.dueDate) < new Date()
        );
      }

      setInvoices(filteredMocks);
    }

    setIsLoading(false);
  }, []);

  // Fonction pour récupérer une facture spécifique
  const getInvoice = useCallback(async (id: string): Promise<SimpleInvoice | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.get<ApiResponse<SimpleInvoice> | SimpleInvoice>(`/api/invoices/${id}`);
      
      if (response.data) {
        // Si c'est un ApiResponse avec une propriété data
        if ('data' in response.data && response.data.data) {
          return response.data.data as SimpleInvoice;
        }
        // Si c'est directement une SimpleInvoice
        else if ('id' in response.data) {
          return response.data as SimpleInvoice;
        }
      }
      return null;
    } catch {
      console.log('API non disponible, recherche dans les mocks');
      const mockInvoice = mockInvoices.find(inv => inv.id === id);
      return mockInvoice || null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour créer une facture
  const createInvoice = useCallback(async (data: CreateInvoiceRequest): Promise<SimpleInvoice> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.post<ApiResponse<SimpleInvoice> | SimpleInvoice>('/api/invoices', data);
      
      let newInvoice: SimpleInvoice;
      
      if (response.data) {
        // Si c'est un ApiResponse avec une propriété data
        if ('data' in response.data && response.data.data) {
          newInvoice = response.data.data as SimpleInvoice;
        }
        // Si c'est directement une SimpleInvoice
        else if ('id' in response.data) {
          newInvoice = response.data as SimpleInvoice;
        }
        else {
          throw new Error('Format de réponse invalide');
        }
        
        setInvoices(prev => [...prev, newInvoice]);
        return newInvoice;
      }
      
      throw new Error('Pas de données dans la réponse');
    } catch {
      console.log('API non disponible, simulation de la création');
      
      // Simulation de création de facture
      const newInvoice: SimpleInvoice = {
        id: `mock-invoice-${Date.now()}`,
        number: `FAC-2024-${String(invoices.length + 1).padStart(3, '0')}`,
        userId: data.userId,
        status: 'DRAFT',
        totalAmount: data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        taxAmount: 0,
        discountAmount: 0,
        issueDate: new Date(),
        dueDate: data.dueDate,
        description: data.description,
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: data.items.map((item, index) => ({
          id: `mock-item-${Date.now()}-${index}`,
          ...item,
          totalPrice: item.quantity * item.unitPrice,
        })),
        payments: [],
      };
      
      setInvoices(prev => [...prev, newInvoice]);
      return newInvoice;
    } finally {
      setIsLoading(false);
    }
  }, [invoices.length]);

  // Fonction pour mettre à jour le statut d'une facture
  const updateInvoiceStatus = useCallback(async (id: string, status: InvoiceStatus): Promise<SimpleInvoice> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.put<ApiResponse<SimpleInvoice> | SimpleInvoice>(`/api/invoices/${id}/status`, { status });
      
      let updatedInvoice: SimpleInvoice;
      
      if (response.data) {
        // Si c'est un ApiResponse avec une propriété data
        if ('data' in response.data && response.data.data) {
          updatedInvoice = response.data.data as SimpleInvoice;
        }
        // Si c'est directement une SimpleInvoice
        else if ('id' in response.data) {
          updatedInvoice = response.data as SimpleInvoice;
        }
        else {
          throw new Error('Format de réponse invalide');
        }
        
        setInvoices(prev => prev.map(inv => 
          inv.id === id ? updatedInvoice : inv
        ));
        return updatedInvoice;
      }
      
      throw new Error('Pas de données dans la réponse');
    } catch {
      console.log('API non disponible, simulation de la mise à jour');
      
      const updatedInvoice = invoices.find(inv => inv.id === id);
      if (updatedInvoice) {
        const updated = { 
          ...updatedInvoice, 
          status,
          updatedAt: new Date(),
          ...(status === 'PAID' ? { paidDate: new Date() } : {})
        };
        setInvoices(prev => prev.map(inv => inv.id === id ? updated : inv));
        return updated;
      }
      
      throw new Error('Facture non trouvée');
    } finally {
      setIsLoading(false);
    }
  }, [invoices]);

  // Fonction pour supprimer une facture
  const deleteInvoice = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.delete(`/api/invoices/${id}`);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch {
      console.log('API non disponible, simulation de la suppression');
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour récupérer les factures en retard
  const getOverdueInvoices = useCallback(async () => {
    await fetchInvoices({ overdue: true });
  }, [fetchInvoices]);

  // Fonction pour récupérer les factures en attente
  const getPendingInvoices = useCallback(async () => {
    await fetchInvoices({ status: 'PENDING' });
  }, [fetchInvoices]);

  // Fonction pour marquer comme payée
  const markAsPaid = useCallback(async (id: string): Promise<SimpleInvoice> => {
    return await updateInvoiceStatus(id, 'PAID');
  }, [updateInvoiceStatus]);

  // Fonction pour envoyer une facture
  const sendInvoice = useCallback(async (id: string) => {
    try {
      await apiService.post(`/api/invoices/${id}/send`);
      await updateInvoiceStatus(id, 'PENDING');
    } catch {
      console.log('API non disponible, simulation de l\'envoi');
      await updateInvoiceStatus(id, 'PENDING');
    }
  }, [updateInvoiceStatus]);

  // Fonction pour rafraîchir les factures
  const refreshInvoices = useCallback(async () => {
    await fetchInvoices();
  }, [fetchInvoices]);

  return {
    // État
    invoices,
    isLoading,
    error,
    
    // Statistiques
    totalAmount,
    paidAmount,
    pendingAmount,
    overdueCount,
    
    // Actions CRUD
    fetchInvoices,
    getInvoice,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    
    // Actions spécifiques
    getOverdueInvoices,
    getPendingInvoices,
    markAsPaid,
    sendInvoice,
    
    // Utilitaires
    clearError,
    refreshInvoices,
  };
}
