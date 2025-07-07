// Index des hooks API
// Export centralisé pour faciliter les imports

export { useMaterials } from './useMaterials';
export { useLocations } from './useLocations';
export { useClients } from './useClients';
export { useSearch } from './useSearch';

// Types réexportés pour faciliter l'utilisation
export type {
  MaterialSearchFilters,
  LocationSearchFilters,
  ClientSearchFilters,
  CreateMaterielRequest,
  UpdateMaterielRequest,
  CreateLocationRequest,
  UpdateLocationRequest,
} from '@/types';
