// Mock data pour le développement du dashboard
// Données factices pour tester l'interface utilisateur

import { 
  DashboardStats, 
  DashboardAlerts, 
  DashboardRecentActivity,
  DashboardChartData,
  LocationStatus,
  MaterielType,
  PaymentStatus
} from '@/types';

export const mockDashboardStats: DashboardStats = {
  totalUsers: 127,
  totalMateriels: 45,
  totalLocations: 234,
  activeLocations: 18,
  monthlyRevenue: 45250.75,
  materiels: {
    available: 32,
    rented: 18,
    maintenance: 3,
    outOfOrder: 2,
  },
  locations: {
    pending: 5,
    active: 18,
    completed: 201,
    cancelled: 10,
  },
  revenue: {
    today: 1250.50,
    thisWeek: 8750.25,
    thisMonth: 45250.75,
    lastMonth: 38420.60,
    growth: 17.8,
  },
};

export const mockDashboardAlerts: DashboardAlerts = {
  overdueRentals: 3,
  upcomingDeadlines: 7,
  maintenanceNeeded: 2,
  lowStock: 1,
  paymentOverdue: 4,
  documentsExpiring: 2,
};

export const mockDashboardRecentActivity: DashboardRecentActivity = {
  locations: [], // Simplifié pour éviter les erreurs de types Prisma complexes
  newClients: 8,
  completedLocations: 12,
  recentPayments: [
    {
      id: 'pay-001',
      amount: 750.00,
      client: 'Martin Construction',
      date: '2025-07-08',
      status: PaymentStatus.COMPLETED,
    },
    {
      id: 'pay-002',
      amount: 1200.00,
      client: 'Dupont BTP',
      date: '2025-07-07',
      status: PaymentStatus.COMPLETED,
    },
    {
      id: 'pay-003',
      amount: 450.00,
      client: 'Renovation Plus',
      date: '2025-07-06',
      status: PaymentStatus.PENDING,
    },
  ],
  recentMaintenance: [
    {
      id: 'maint-001',
      materielName: 'Pelleteuse 20T',
      type: 'Révision générale',
      date: '2025-07-09',
      status: 'EN_COURS',
    },
    {
      id: 'maint-002',
      materielName: 'Nacelle 15m',
      type: 'Contrôle technique',
      date: '2025-07-05',
      status: 'TERMINE',
    },
  ],
};

export const mockChartData: DashboardChartData = {
  revenue: [
    { date: '2025-07-01', amount: 1200, period: 'day' },
    { date: '2025-07-02', amount: 890, period: 'day' },
    { date: '2025-07-03', amount: 1450, period: 'day' },
    { date: '2025-07-04', amount: 980, period: 'day' },
    { date: '2025-07-05', amount: 1680, period: 'day' },
    { date: '2025-07-06', amount: 1250, period: 'day' },
    { date: '2025-07-07', amount: 1890, period: 'day' },
    { date: '2025-07-08', amount: 1100, period: 'day' },
  ],
  locations: [
    { date: '2025-07-01', count: 3, status: LocationStatus.ACTIVE },
    { date: '2025-07-02', count: 2, status: LocationStatus.COMPLETED },
    { date: '2025-07-03', count: 4, status: LocationStatus.ACTIVE },
    { date: '2025-07-04', count: 1, status: LocationStatus.PENDING },
    { date: '2025-07-05', count: 5, status: LocationStatus.ACTIVE },
    { date: '2025-07-06', count: 3, status: LocationStatus.COMPLETED },
    { date: '2025-07-07', count: 2, status: LocationStatus.ACTIVE },
    { date: '2025-07-08', count: 4, status: LocationStatus.PENDING },
  ],
  materials: [
    { type: MaterielType.GRUE_MOBILE, available: 8, rented: 4, maintenance: 1 },
    { type: MaterielType.PELLETEUSE, available: 12, rented: 6, maintenance: 1 },
    { type: MaterielType.NACELLE_CISEAUX, available: 6, rented: 3, maintenance: 0 },
    { type: MaterielType.NACELLE_TELESCOPIQUE, available: 4, rented: 2, maintenance: 1 },
    { type: MaterielType.COMPACTEUR, available: 3, rented: 2, maintenance: 0 },
    { type: MaterielType.AUTRE, available: 5, rented: 1, maintenance: 0 },
  ],
};
