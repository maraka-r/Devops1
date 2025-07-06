// Types TypeScript pour l'application Daga Maraka
// Location de matériel BTP

// Importer et réexporter les types Prisma générés
import { 
  User, 
  Materiel, 
  Location, 
  UserRole, 
  MaterielType, 
  LocationStatus 
} from '@/generated/prisma';

// Réexporter les types comme des valeurs (pour Zod)
export { UserRole, MaterielType, LocationStatus };

// Réexporter les types d'entités
export type { User, Materiel, Location };

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
  availableMateriels: number;
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
  available?: boolean;
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
