// Types TypeScript pour l'application Daga Maraka
// Location de matériel BTP

// Importer et réexporter les types Prisma générés
import { 
  User, 
  Materiel, 
  Location, 
  Invoice,
  InvoiceItem,
  Payment,
  UserRole,
  UserStatus,
  MaterielType,
  MaterielStatus, 
  LocationStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus
} from '@/generated/prisma';

// Réexporter les types comme des valeurs (pour Zod)
export { UserRole, UserStatus, MaterielType, MaterielStatus, LocationStatus, InvoiceStatus, PaymentMethod, PaymentStatus };

// Réexporter les types d'entités
export type { User, Materiel, Location, Invoice, InvoiceItem, Payment };

// ===========================
// TYPES POUR L'AUTHENTIFICATION
// ===========================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  company?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

// Types pour les requêtes authentifiées
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// ===========================
// TYPES POUR LES API RESPONSES
// ===========================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===========================
// TYPES POUR LES MATÉRIELS
// ===========================

export interface MaterielWithLocations extends Materiel {
  locations: Location[];
}

// Spécifications techniques par type de matériel
export interface GrueSpecifications {
  capaciteMax: number; // en tonnes
  hauteurMax: number;  // en mètres
  porteeMax: number;   // en mètres
  poids: number;       // en tonnes
}

export interface NacelleSpecifications {
  hauteurTravail: number; // en mètres
  porteeMax: number;      // en mètres
  capacitePersonnes: number;
  poids: number;          // en kg
}

export interface TelescopiqueSpecifications {
  capaciteMax: number;    // en tonnes
  hauteurMax: number;     // en mètres
  porteeMax: number;      // en mètres
  poids: number;          // en tonnes
}

// Union type pour toutes les spécifications
export type MaterielSpecifications = 
  | GrueSpecifications 
  | NacelleSpecifications 
  | TelescopiqueSpecifications 
  | Record<string, unknown>;

export interface CreateMaterielRequest {
  name: string;
  type: MaterielType;
  description?: string;
  pricePerDay: number;
  specifications?: MaterielSpecifications;
  images?: string[];
  manualUrl?: string;
}

export interface UpdateMaterielRequest extends Partial<CreateMaterielRequest> {
  id: string;
}

// Spécifications techniques par type de matériel
export interface GrueSpecifications {
  capaciteMax: number; // en tonnes
  hauteurMax: number;  // en mètres
  porteeMax: number;   // en mètres
  poids: number;       // en tonnes
}

export interface NacelleSpecifications {
  hauteurTravail: number; // en mètres
  porteeMax: number;      // en mètres
  capacitePersonnes: number;
  poids: number;          // en kg
}

export interface TelescopiqueSpecifications {
  capaciteMax: number;    // en tonnes
  hauteurMax: number;     // en mètres
  porteeMax: number;      // en mètres
  poids: number;          // en tonnes
}

// ===========================
// TYPES POUR LES LOCATIONS
// ===========================

export interface LocationWithDetails extends Location {
  user: Omit<User, 'password'>;
  materiel: Materiel;
}

export interface CreateLocationRequest {
  materielId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface UpdateLocationRequest {
  startDate?: string;
  endDate?: string;
  status?: LocationStatus;
  notes?: string;
}

// ===========================
// TYPES POUR LES DASHBOARDS
// ===========================

export interface DashboardStats {
  totalUsers: number;
  totalMateriels: number;
  totalLocations: number;
  activeLocations: number;
  monthlyRevenue: number;
  materiels: {
    available: number;
    rented: number;
    maintenance: number;
  };
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export interface PopularMateriel {
  materiel: Materiel;
  locationCount: number;
  totalRevenue: number;
}

// ===========================
// TYPES POUR LES FILTRES
// ===========================

export interface MaterielFilters {
  type?: MaterielType;
  status?: MaterielStatus;
  priceMin?: number;
  priceMax?: number;
  search?: string;
}

export interface LocationFilters {
  userId?: string;
  materielId?: string;
  status?: LocationStatus;
  startDate?: string;
  endDate?: string;
}

// ===========================
// TYPES POUR LES FORMULAIRES
// ===========================

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// ===========================
// TYPES POUR LA PAGINATION
// ===========================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ===========================
// TYPES POUR LES NOTIFICATIONS
// ===========================

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// ===========================
// TYPES POUR LA FACTURATION
// ===========================

export interface InvoiceWithDetails extends Invoice {
  user: User;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceCreateRequest {
  userId: string;
  locationIds?: string[];
  dueDate: string;
  description?: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    locationId?: string;
  }[];
}

export interface InvoiceUpdateRequest {
  status?: InvoiceStatus;
  dueDate?: string;
  description?: string;
  notes?: string;
}

export interface PaymentCreateRequest {
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface PaymentUpdateRequest {
  status?: PaymentStatus;
  transactionId?: string;
  reference?: string;
  notes?: string;
}

export interface BillingSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  invoiceCount: number;
  paymentCount: number;
  averageInvoiceAmount: number;
}

export interface InvoiceFilters {
  userId?: string;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
}

export interface PaymentFilters {
  userId?: string;
  invoiceId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  startDate?: string;
  endDate?: string;
}

// ===========================
// TYPES POUR LES STATISTIQUES DE FACTURATION
// ===========================

export interface InvoiceStats {
  totalAmount: number;
  count: number;
  avgAmount: number;
  byStatus: Record<InvoiceStatus, { count: number; amount: number }>;
  byMonth: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
}

export interface PaymentStats {
  totalAmount: number;
  count: number;
  avgAmount: number;
  byStatus: Record<PaymentStatus, { count: number; amount: number }>;
  byMethod: Record<PaymentMethod, { count: number; amount: number }>;
}

export interface UpcomingInvoices {
  dueThisWeek: Invoice[];
  dueThisMonth: Invoice[];
  overdue: Invoice[];
  total: number;
  totalAmount: number;
}

// ===========================
// TYPES POUR DASHBOARD CLIENT
// ===========================

export interface ClientDashboardOverview {
  user: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    role: UserRole;
    memberSince: Date;
  };
  statistics: {
    locations: {
      total: number;
      active: number;
      completed: number;
      upcoming: number;
    };
    spending: {
      total: number;
      thisMonth: number;
      byMonth: Record<string, number>;
    };
    favorites: {
      count: number;
      available: number;
    };
  };
  currentActivity: {
    activeLocations: Array<{
      id: string;
      materiel: Materiel;
      startDate: Date;
      endDate: Date;
      totalPrice: number;
      status: LocationStatus;
      daysRemaining: number;
    }>;
    upcomingLocations: Array<{
      id: string;
      materiel: Materiel;
      startDate: Date;
      endDate: Date;
      totalPrice: number;
      status: LocationStatus;
      daysUntilStart: number;
    }>;
  };
  favoriteMateriels: Materiel[];
  alerts: Array<{
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    count?: number;
  }>;
}

export interface ClientDashboardStats {
  user: {
    id: string;
    name: string;
    memberSince: Date;
    role: UserRole;
  };
  period: {
    type: string;
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalLocations: number;
    completedLocations: number;
    cancelledLocations: number;
    totalSpent: number;
    averageOrderValue: number;
    averageLocationDuration: number;
    uniqueMaterialsRented: number;
    completionRate: number;
    cancellationRate: number;
  };
  performance: {
    vsAverageClient: {
      locations: number;
      spending: number;
      locationsPercentage: number;
      spendingPercentage: number;
    };
  };
  breakdown: {
    byType: Array<{
      type: string;
      count: number;
      totalSpent: number;
      percentage: number;
      uniqueMaterials: number;
    }>;
    topMaterials: Array<{
      material: string;
      type: string;
      count: number;
      totalSpent: number;
    }>;
    monthlyTrends: Array<{
      month: string;
      locations: number;
      spending: number;
    }>;
  };
}

export interface ClientSpendingAnalysis {
  summary: {
    totalSpent: number;
    totalLocations: number;
    totalRentalDays: number;
    averageOrderValue: number;
    averageDailySpending: number;
  };
  trends: {
    isIncreasing: boolean;
    growthRate: number;
    projection: {
      nextPeriod: number;
      nextYear: number;
    };
    spendingByPeriod: Array<{
      period: string;
      amount: number;
      locations: number;
    }>;
  };
  breakdown: {
    byType: Array<{
      type: string;
      totalSpent: number;
      locationCount: number;
      uniqueMaterials: number;
      averageSpent: number;
      percentage: number;
    }>;
    topMaterials: Array<{
      id: string;
      name: string;
      type: string;
      totalSpent: number;
      locationCount: number;
      averageSpent: number;
      lastRented: Date;
    }>;
  };
  comparison: {
    vsAverageClient: {
      totalSpending: number;
      averageOrderValue: number;
      spendingPercentage: number;
      orderValuePercentage: number;
    };
  };
  recommendations: Array<{
    type: string;
    title: string;
    message: string;
    potentialSavings?: number;
  }>;
}

// ===========================
// TYPES POUR LE CALENDRIER
// ===========================

// Type pour les événements du calendrier
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'location' | 'maintenance' | 'reservation' | 'holiday';
  status: 'active' | 'completed' | 'cancelled';
  materielId?: string;
  userId?: string;
  locationId?: string;
  metadata?: {
    materielName?: string;
    userName?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    color?: string;
  };
}

// Type pour les événements du calendrier (réponse API)
export interface CalendarEventsResponse {
  success: boolean;
  data: {
    events: CalendarEvent[];
    summary: {
      total: number;
      byType: {
        location: number;
        maintenance: number;
        reservation: number;
        holiday: number;
      };
      byStatus: {
        active: number;
        completed: number;
        cancelled: number;
      };
    };
    period: {
      start: Date;
      end: Date;
      monthName?: string;
    };
  };
}

// Type pour la disponibilité du matériel
export interface MaterialAvailability {
  date: Date;
  status: 'available' | 'rented' | 'maintenance' | 'reserved';
  events: CalendarEvent[];
  timeSlots?: {
    morning: 'available' | 'occupied';
    afternoon: 'available' | 'occupied';
    fullDay: 'available' | 'occupied';
  };
}

// Type pour la disponibilité du matériel (réponse API)
export interface MaterialAvailabilityResponse {
  success: boolean;
  data: {
    materielId: string;
    materielName: string;
    category: string;
    availability: MaterialAvailability[];
    summary: {
      totalDays: number;
      availableDays: number;
      rentedDays: number;
      maintenanceDays: number;
      reservedDays: number;
      occupancyRate: number;
    };
    period: {
      start: Date;
      end: Date;
    };
    nextAvailableDate?: Date;
    recommendations?: {
      suggestedDates: Date[];
      alternativeMaterials: string[];
    };
  };
}

// Type pour les filtres du calendrier
export interface CalendarFilters {
  userId?: string;
  materielId?: string;
  category?: string;
  type?: CalendarEvent['type'];
  status?: CalendarEvent['status'];
  startDate?: Date;
  endDate?: Date;
  includeMaintenance?: boolean;
  includeReservations?: boolean;
}

// Type pour les périodes du calendrier
export interface CalendarPeriod {
  year: number;
  month: number;
  monthName: string;
  daysInMonth: number;
  startDate: Date;
  endDate: Date;
}
