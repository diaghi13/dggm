import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api/inventory';
import { toast } from 'sonner';

// Query Keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...inventoryKeys.lists(), filters] as const,
  detail: (id: number) => [...inventoryKeys.all, 'detail', id] as const,
  history: (id: number) => [...inventoryKeys.all, 'history', id] as const,
  byWarehouse: (warehouseId: number) => [...inventoryKeys.all, 'warehouse', warehouseId] as const,
  byProduct: (productId: number) => [...inventoryKeys.all, 'product', productId] as const,
  lowStock: (warehouseId?: number) => [...inventoryKeys.all, 'low-stock', warehouseId] as const,
  valuation: (warehouseId?: number) => [...inventoryKeys.all, 'valuation', warehouseId] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Hook per ottenere l'inventario con filtri opzionali
 */
export function useInventory(params?: {
  warehouse_id?: number;
  product_id?: number;
  low_stock?: boolean;
  search?: string;
  per_page?: number;
}) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => inventoryApi.getAll(params),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook per ottenere un singolo inventario per ID
 */
export function useInventoryById(id: number, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => inventoryApi.getById(id),
    enabled: enabled && !!id,
    staleTime: 30000,
  });
}

/**
 * Hook per ottenere lo storico movimenti di un inventario
 */
export function useInventoryHistory(id: number, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.history(id),
    queryFn: async () => {
      // L'API getById già include i movimenti
      const data = await inventoryApi.getById(id);
      return { data: data.movements || [] };
    },
    enabled: enabled && !!id,
    staleTime: 30000,
  });
}

/**
 * Hook per ottenere l'inventario di un magazzino specifico
 */
export function useInventoryByWarehouse(warehouseId: number, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.byWarehouse(warehouseId),
    queryFn: () => inventoryApi.getByWarehouse(warehouseId),
    enabled: enabled && !!warehouseId,
    staleTime: 30000,
  });
}

/**
 * Hook per ottenere l'inventario di un prodotto specifico
 */
export function useInventoryByProduct(productId: number, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.byProduct(productId),
    queryFn: () => inventoryApi.getByProduct(productId),
    enabled: enabled && !!productId,
    staleTime: 30000,
  });
}

/**
 * Hook per ottenere gli articoli sotto scorta minima
 */
export function useLowStockItems(warehouseId?: number) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(warehouseId),
    queryFn: () => inventoryApi.getLowStock(warehouseId),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook per ottenere la valutazione dell'inventario
 */
export function useInventoryValuation(warehouseId?: number) {
  return useQuery({
    queryKey: inventoryKeys.valuation(warehouseId),
    queryFn: () => inventoryApi.getValuation(warehouseId),
    staleTime: 60000, // 1 minute
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Hook per aggiustare le scorte
 */
export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: App.Data.InventoryData) => inventoryApi.adjustStock(data),
    onSuccess: (data) => {
      // Invalida le query relative all'inventario
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });

      toast.success('Scorte aggiornate con successo');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante l\'aggiornamento delle scorte';
      toast.error(message);
    },
  });
}

/**
 * Hook per aggiornare lo stock minimo
 */
export function useUpdateMinimumStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, minimumStock }: { id: number; minimumStock: number }) =>
      inventoryApi.updateMinimumStock(id, minimumStock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Scorta minima aggiornata');
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Errore durante l\'aggiornamento';
      toast.error(message);
    },
  });
}

/**
 * Hook per aggiornare lo stock massimo
 */
export function useUpdateMaximumStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, maximumStock }: { id: number; maximumStock: number }) =>
      inventoryApi.updateMaximumStock(id, maximumStock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.success('Scorta massima aggiornata');
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Errore durante l\'aggiornamento';
      toast.error(message);
    },
  });
}
