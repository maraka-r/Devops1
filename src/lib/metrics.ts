import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Initialiser le registre et les métriques dans un singleton pour éviter les problèmes de HMR
const initMetrics = () => {
  // Réinitialiser le registre si nécessaire
  register.clear();
  
  // Initialiser les métriques par défaut
  collectDefaultMetrics({ prefix: 'nextjs_', register });

  // Métriques personnalisées
  const metrics = {
    httpRequestsTotal: new Counter({
      name: 'nextjs_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [register],
    }),

    httpRequestDuration: new Histogram({
      name: 'nextjs_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [register],
    }),

    activeConnections: new Gauge({
      name: 'nextjs_active_connections',
      help: 'Number of active connections',
      registers: [register],
    }),

    databaseConnections: new Gauge({
      name: 'nextjs_database_connections',
      help: 'Number of active database connections',
      registers: [register],
    }),
  };

  return metrics;
};

// Créer un singleton pour les métriques
let metrics: ReturnType<typeof initMetrics>;

// S'assurer que les métriques sont initialisées une seule fois
if (process.env.NODE_ENV === 'production') {
  metrics = initMetrics();
} else {
  // En développement, réinitialiser à chaque rechargement
  metrics = initMetrics();
}

// Exporter les métriques pour une utilisation interne dans l'application
export { metrics };
