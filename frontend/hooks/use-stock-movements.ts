import { useQuery } from '@tanstack/react-query';
import { stockMovementsApi } from '@/lib/api/stock-movements';

// Query Keys
export const stockMovementKeys = {
  all: ['stock-movements'] as const,
  lists: () => [...stockMovementKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...stockMovementKeys.lists(), filters] as const,
  detail: (id: number) => [...stockMovementKeys.all, 'detail', id] as const,
  byProduct: (productId: number, limit?: number) =>
    [...stockMovementKeys.all, 'product', productId, limit] as const,
  byWarehouse: (warehouseId: number) =>
    [...stockMovementKeys.all, 'warehouse', warehouseId] as const,
  rentalHistory: (filters?: Record<string, unknown>) =>
    [...stockMovementKeys.all, 'rental-history', filters] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Hook per ottenere i movimenti di magazzino con filtri opzionali
 */
export function useStockMovements(params?: {
  product_id?: number;
  warehouse_id?: number;
  site_id?: number;
  type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  per_page?: number;
}) {
  return useQuery({
    queryKey: stockMovementKeys.list(params),
    queryFn: () => stockMovementsApi.getAll(params),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook per ottenere un singolo movimento
 */
export function useStockMovement(id: number, enabled = true) {
  return useQuery({
    queryKey: stockMovementKeys.detail(id),
    queryFn: () => stockMovementsApi.getById(id),
    enabled: enabled && !!id,
  });
}

/**
 * Hook per ottenere i movimenti di un prodotto specifico
 */
export function useStockMovementsByProduct(productId: number, limit?: number, enabled = true) {
  return useQuery({
    queryKey: stockMovementKeys.byProduct(productId, limit),
    queryFn: () => stockMovementsApi.getByProduct(productId, limit),
    enabled: enabled && !!productId,
    staleTime: 30000,
  });
}

/**
 * Hook per ottenere i movimenti di un magazzino specifico
 */
export function useStockMovementsByWarehouse(warehouseId: number, enabled = true) {
  return useQuery({
    queryKey: stockMovementKeys.byWarehouse(warehouseId),
    queryFn: () => stockMovementsApi.getByWarehouse(warehouseId),
    enabled: enabled && !!warehouseId,
    staleTime: 30000,
  });
}

/**
 * Hook per ottenere lo storico dei noleggi
 */
export function useRentalHistory(params?: {
  product_id?: number;
  site_id?: number;
  active_only?: boolean;
}) {
  return useQuery({
    queryKey: stockMovementKeys.rentalHistory(params),
    queryFn: () => stockMovementsApi.getRentalHistory(params),
    staleTime: 30000,
  });
}
