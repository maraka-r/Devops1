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
  Favori,
  CompanySettings,
  UserSettings,
  UserRole,
  UserStatus,
  MaterielType,
  MaterielStatus, 
  LocationStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  NotificationType,
  NotificationPriority,
  SupportCategory,
  SupportPriority,
  SupportStatus
} from '@/generated/prisma';

// Réexporter les types comme des valeurs (pour Zod)
export { UserRole, UserStatus, MaterielType, MaterielStatus, LocationStatus, InvoiceStatus, PaymentMethod, PaymentStatus, NotificationType, NotificationPriority, SupportCategory, SupportPriority, SupportStatus };

// Réexporter les types d'entités
export type { User, Materiel, Location, Invoice, InvoiceItem, Payment, Favori, CompanySettings, UserSettings };
// Note: Notification type from Prisma is available as PrismaNotification to avoid conflicts

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

// ===========================
// TYPES POUR LES RAPPORTS
// ===========================

// Types pour les rapports de revenus
export interface RevenueReport {
  period: {
    start: Date;
    end: Date;
    type: 'day' | 'week' | 'month' | 'quarter' | 'year';
  };
  revenue: {
    total: number;
    locations: number;
    penalties: number;
    taxes: number;
    net: number;
  };
  growth: {
    percentage: number;
    previousPeriod: number;
    trend: 'up' | 'down' | 'stable';
  };
  breakdown: {
    byMaterial: MaterialRevenueBreakdown[];
    byClient: ClientRevenueBreakdown[];
    byPeriod: PeriodRevenueBreakdown[];
  };
  metrics: {
    averageOrderValue: number;
    totalOrders: number;
    activeClients: number;
    conversionRate: number;
  };
}

export interface MaterialRevenueBreakdown {
  materielId: string;
  materielName: string;
  category: string;
  revenue: number;
  percentage: number;
  rentals: number;
  averageRentalValue: number;
  utilizationRate: number;
}

export interface ClientRevenueBreakdown {
  clientId: string;
  clientName: string;
  company?: string;
  revenue: number;
  percentage: number;
  orders: number;
  averageOrderValue: number;
  lastOrder: Date;
}

export interface PeriodRevenueBreakdown {
  period: string;
  date: Date;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growth: number;
}

// Types pour les rapports d'utilisation du matériel
export interface MaterialUsageReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalMaterials: number;
    activeMaterials: number;
    averageUtilization: number;
    totalRentalDays: number;
    revenue: number;
  };
  materials: MaterialUsageDetail[];
  categories: CategoryUsageBreakdown[];
  trends: UsageTrend[];
}

export interface MaterialUsageDetail {
  materielId: string;
  materielName: string;
  category: string;
  status: string;
  metrics: {
    totalRentals: number;
    totalDays: number;
    utilizationRate: number;
    revenue: number;
    averageRentalDuration: number;
    maintenanceDays: number;
  };
  performance: {
    bestMonth: string;
    worstMonth: string;
    trend: 'up' | 'down' | 'stable';
    seasonality: number;
  };
}

export interface CategoryUsageBreakdown {
  category: string;
  totalMaterials: number;
  activeMaterials: number;
  utilizationRate: number;
  revenue: number;
  percentage: number;
  popularItems: string[];
}

export interface UsageTrend {
  period: string;
  date: Date;
  totalRentals: number;
  utilizationRate: number;
  revenue: number;
  activeMaterials: number;
}

// Types pour l'analyse des clients
export interface ClientAnalysisReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalClients: number;
    activeClients: number;
    newClients: number;
    churnRate: number;
    averageLifetimeValue: number;
    retentionRate: number;
  };
  segments: ClientSegment[];
  clients: ClientAnalysisDetail[];
  trends: ClientTrend[];
}

export interface ClientSegment {
  segment: string;
  description: string;
  clientCount: number;
  percentage: number;
  averageRevenue: number;
  averageOrders: number;
  characteristics: string[];
}

export interface ClientAnalysisDetail {
  clientId: string;
  clientName: string;
  company?: string;
  email: string;
  phone?: string;
  registrationDate: Date;
  metrics: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    lastOrderDate: Date;
    daysSinceLastOrder: number;
    lifetimeValue: number;
  };
  behavior: {
    preferredCategories: string[];
    averageRentalDuration: number;
    seasonality: string;
    paymentReliability: 'excellent' | 'good' | 'fair' | 'poor';
  };
  segment: string;
  risk: {
    churnRisk: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

export interface ClientTrend {
  period: string;
  date: Date;
  newClients: number;
  activeClients: number;
  churnedClients: number;
  retentionRate: number;
  averageRevenue: number;
}

// Types pour les rapports de performance générale
export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  overview: {
    totalRevenue: number;
    totalOrders: number;
    activeClients: number;
    activeMaterials: number;
    utilizationRate: number;
    customerSatisfaction: number;
  };
  kpis: {
    financial: FinancialKPI[];
    operational: OperationalKPI[];
    customer: CustomerKPI[];
  };
  goals: PerformanceGoal[];
  insights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
}

export interface FinancialKPI {
  name: string;
  value: number;
  target: number;
  previous: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface OperationalKPI {
  name: string;
  value: number;
  target: number;
  previous: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface CustomerKPI {
  name: string;
  value: number;
  target: number;
  previous: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface PerformanceGoal {
  name: string;
  target: number;
  current: number;
  progress: number;
  deadline: Date;
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed';
}

export interface PerformanceInsight {
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
}

export interface PerformanceRecommendation {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
  timeline: string;
  actions: string[];
}

// Types pour l'export de rapports
export interface ReportExportRequest {
  reportType: 'revenue' | 'materials-usage' | 'client-analysis' | 'performance';
  format: 'pdf' | 'excel' | 'csv';
  period: {
    start: Date;
    end: Date;
  };
  filters?: {
    clientIds?: string[];
    materielIds?: string[];
    categories?: string[];
    includeCharts?: boolean;
    includeSummary?: boolean;
    includeDetails?: boolean;
  };
  options?: {
    language?: 'fr' | 'en';
    currency?: 'EUR' | 'USD' | 'CAD';
    timezone?: string;
  };
}

export interface ReportExportResponse {
  success: boolean;
  data?: {
    exportId: string;
    filename: string;
    format: string;
    size: number;
    url: string;
    expiresAt: Date;
  };
  error?: string;
}

// Types pour les réponses API des rapports
export interface RevenueReportResponse {
  success: boolean;
  data: RevenueReport;
  message: string;
  generatedAt: Date;
}

export interface MaterialUsageReportResponse {
  success: boolean;
  data: MaterialUsageReport;
  message: string;
  generatedAt: Date;
}

export interface ClientAnalysisReportResponse {
  success: boolean;
  data: ClientAnalysisReport;
  message: string;
  generatedAt: Date;
}

export interface PerformanceReportResponse {
  success: boolean;
  data: PerformanceReport;
  message: string;
  generatedAt: Date;
}

// ===========================
// TYPES POUR LA GESTION DES FAVORIS
// ===========================

export interface FavoriteResponse {
  id: string;
  userId: string;
  materielId: string;
  materiel: {
    id: string;
    name: string;
    type: MaterielType;
    description: string | null;
    pricePerDay: number;
    status: MaterielStatus;
    images: string[];
    specifications: Record<string, unknown> | null; // JsonValue
    manualUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  createdAt: Date;
}

export interface FavoriteListResponse {
  success: boolean;
  data: FavoriteResponse[];
  message?: string;
}

export interface FavoriteActionResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    added: boolean;
    materiel: {
      id: string;
      name: string;
      type: MaterielType;
      pricePerDay: number;
      status: MaterielStatus;
    };
  };
}

export interface FavoriteRequest {
  materielId: string;
}

// Types pour les statistiques de favoris
export interface FavoriteStats {
  totalFavorites: number;
  favoritesByCategory: Record<string, number>;
  mostFavorited: Array<{
    materiel: {
      id: string;
      name: string;
      type: MaterielType;
      description: string | null;
      pricePerDay: number;
      status: MaterielStatus;
      images: string[];
      specifications: Record<string, unknown> | null;
      manualUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    count: number;
  }>;
  recentlyAdded: FavoriteResponse[];
}

// ===========================
// TYPES POUR LA GESTION DES NOTIFICATIONS
// ===========================

export interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  priority: NotificationPriority;
  createdAt: Date;
  readAt: Date | null;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: NotificationResponse[];
    pagination: {
      total: number;
      unread: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    isRead: boolean;
    readAt: Date | null;
  };
}

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority?: NotificationPriority;
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recent: NotificationResponse[];
}

export interface BulkNotificationResponse {
  success: boolean;
  message: string;
  data: {
    affectedCount: number;
    notifications: NotificationResponse[];
  };
}

// ===========================
// TYPES POUR LE SUPPORT
// ===========================

export interface SupportTicketRequest {
  title: string;
  description: string;
  category: SupportCategory;
  priority?: SupportPriority;
}

export interface SupportTicketResponse {
  id: string;
  title: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  userId: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  repliesCount?: number;
  lastReplyAt?: string;
}

export interface SupportTicketListResponse {
  success: boolean;
  data: {
    tickets: SupportTicketResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    stats: {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      closed: number;
    };
  };
}

export interface SupportTicketDetailResponse {
  success: boolean;
  data: {
    ticket: SupportTicketResponse;
    replies: SupportReplyResponse[];
  };
}

export interface SupportReplyRequest {
  message: string;
  isInternal?: boolean;
  attachments?: string[];
}

export interface SupportReplyResponse {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SupportActionResponse {
  success: boolean;
  message: string;
  data?: {
    ticket?: SupportTicketResponse;
    reply?: SupportReplyResponse;
  };
}

export interface SupportFilters {
  category?: SupportCategory;
  priority?: SupportPriority;
  status?: SupportStatus;
  userId?: string;
  assignedToId?: string;
  startDate?: Date;
  endDate?: Date;
}

// ===========================
// TYPES POUR LES PARAMÈTRES
// ===========================

export interface CompanySettingsRequest {
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo?: string;
  taxRate?: number;
  currency?: string;
  timezone?: string;
  language?: string;
  defaultRentalDuration?: number;
  minRentalDuration?: number;
  maxRentalDuration?: number;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export interface CompanySettingsResponse {
  id: string;
  companyName: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo?: string;
  taxRate: number;
  currency: string;
  timezone: string;
  language: string;
  defaultRentalDuration: number;
  minRentalDuration: number;
  maxRentalDuration: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsRequest {
  theme?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  notificationSound?: boolean;
  locationReminders?: boolean;
  paymentReminders?: boolean;
  materialAvailability?: boolean;
  promotionalEmails?: boolean;
  defaultLocationDuration?: number;
  autoRenewal?: boolean;
  favoriteViewFirst?: boolean;
  dashboardLayout?: string;
  compactMode?: boolean;
  showTutorials?: boolean;
  twoFactorEnabled?: boolean;
  sessionTimeout?: number;
}

export interface UserSettingsResponse {
  id: string;
  userId: string;
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationSound: boolean;
  locationReminders: boolean;
  paymentReminders: boolean;
  materialAvailability: boolean;
  promotionalEmails: boolean;
  defaultLocationDuration: number;
  autoRenewal: boolean;
  favoriteViewFirst: boolean;
  dashboardLayout: string;
  compactMode: boolean;
  showTutorials: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsActionResponse {
  success: boolean;
  message: string;
  data?: {
    companySettings?: CompanySettingsResponse;
    userSettings?: UserSettingsResponse;
  };
}

// ===========================
// TYPES POUR LA RECHERCHE
// ===========================

export interface SearchFilters {
  query?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MaterialSearchFilters extends SearchFilters {
  type?: MaterielType;
  status?: MaterielStatus;
  availableFrom?: string;
  availableTo?: string;
  specifications?: Record<string, unknown>;
}

export interface ClientSearchFilters extends SearchFilters {
  role?: UserRole;
  status?: UserStatus;
  company?: string;
  registeredFrom?: string;
  registeredTo?: string;
}

export interface LocationSearchFilters extends SearchFilters {
  userId?: string;
  materielId?: string;
  status?: LocationStatus;
  startDate?: string;
  endDate?: string;
  totalMin?: number;
  totalMax?: number;
}

export interface SearchResult<T> {
  id: string;
  relevanceScore: number;
  item: T;
  highlights?: {
    field: string;
    value: string;
    matchedText: string;
  }[];
}

export interface MaterialSearchResult extends SearchResult<Materiel> {
  item: Materiel & {
    availability?: {
      isAvailable: boolean;
      nextAvailableDate?: string;
      currentLocation?: {
        id: string;
        endDate: string;
        user: {
          name: string;
        };
      };
    };
  };
}

export interface ClientSearchResult extends SearchResult<Omit<User, 'password'>> {
  item: Omit<User, 'password'> & {
    stats?: {
      totalLocations: number;
      totalSpent: number;
      lastLocationDate?: string;
      averageOrderValue: number;
    };
  };
}

export interface LocationSearchResult extends SearchResult<Location> {
  item: Location & {
    user: Pick<User, 'id' | 'name' | 'email' | 'company'>;
    materiel: Pick<Materiel, 'id' | 'name' | 'type' | 'pricePerDay'>;
  };
}

export interface SearchResponse<T> {
  success: boolean;
  data: {
    results: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    facets?: {
      types?: { type: string; count: number }[];
      statuses?: { status: string; count: number }[];
      priceRanges?: { range: string; count: number }[];
      categories?: { category: string; count: number }[];
    };
    suggestions?: string[];
    searchTime: number;
  };
  message?: string;
}

export type MaterialSearchResponse = SearchResponse<MaterialSearchResult>;
export type ClientSearchResponse = SearchResponse<ClientSearchResult>;
export type LocationSearchResponse = SearchResponse<LocationSearchResult>;

export interface SearchStats {
  totalSearches: number;
  popularQueries: Array<{
    query: string;
    count: number;
    category: 'materials' | 'clients' | 'locations';
  }>;
  recentSearches: Array<{
    query: string;
    category: 'materials' | 'clients' | 'locations';
    timestamp: string;
    userId?: string;
  }>;
  noResultsQueries: Array<{
    query: string;
    count: number;
    category: 'materials' | 'clients' | 'locations';
  }>;
}

// ===========================
