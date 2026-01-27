import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ddtsApi, CreateDdtInput, UpdateDdtInput } from '@/lib/api/ddts';
import { toast } from 'sonner';

// Query Keys
export const ddtKeys = {
  all: ['ddts'] as const,
  lists: () => [...ddtKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...ddtKeys.lists(), filters] as const,
  detail: (id: number) => [...ddtKeys.all, 'detail', id] as const,
  activeBySite: (siteId: number) => [...ddtKeys.all, 'active-site', siteId] as const,
  pendingRentals: (warehouseId?: number) => [...ddtKeys.all, 'pending-rentals', warehouseId] as const,
  nextNumber: () => [...ddtKeys.all, 'next-number'] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Hook per ottenere i DDT con filtri opzionali
 */
export function useDdts(params?: {
  type?: string;
  status?: string;
  warehouse_id?: number;
  site_id?: number;
  supplier_id?: number;
  customer_id?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}) {
  return useQuery({
    queryKey: ddtKeys.list(params),
    queryFn: () => ddtsApi.getAll(params),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook per ottenere un singolo DDT
 */
export function useDdt(id: number, enabled = true) {
  return useQuery({
    queryKey: ddtKeys.detail(id),
    queryFn: () => ddtsApi.getById(id),
    enabled: enabled && !!id,
  });
}

/**
 * Hook per ottenere i DDT attivi per un cantiere
 */
export function useActiveDdtsBySite(siteId: number, enabled = true) {
  return useQuery({
    queryKey: ddtKeys.activeBySite(siteId),
    queryFn: () => ddtsApi.getActiveBySite(siteId),
    enabled: enabled && !!siteId,
    staleTime: 30000,
  });
}

/**
 * Hook per ottenere i noleggi in sospeso
 */
export function usePendingRentals(warehouseId?: number) {
  return useQuery({
    queryKey: ddtKeys.pendingRentals(warehouseId),
    queryFn: () => ddtsApi.getPendingRentals(warehouseId),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook per ottenere il prossimo numero DDT
 */
export function useNextDdtNumber() {
  return useQuery({
    queryKey: ddtKeys.nextNumber(),
    queryFn: () => ddtsApi.getNextNumber(),
    staleTime: 0, // Always fresh
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Hook per creare un nuovo DDT
 */
export function useCreateDdt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDdtInput) => ddtsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ddtKeys.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('DDT creato con successo');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante la creazione del DDT';
      toast.error(message);
    },
  });
}

/**
 * Hook per aggiornare un DDT esistente
 */
export function useUpdateDdt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDdtInput }) =>
      ddtsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ddtKeys.all });
      queryClient.invalidateQueries({ queryKey: ddtKeys.detail(variables.id) });
      toast.success('DDT aggiornato con successo');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante l\'aggiornamento del DDT';
      toast.error(message);
    },
  });
}

/**
 * Hook per eliminare un DDT
 */
export function useDeleteDdt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ddtsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ddtKeys.all });
      toast.success('DDT eliminato con successo');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante l\'eliminazione del DDT';
      toast.error(message);
    },
  });
}

/**
 * Hook per confermare un DDT
 * ⚠️ CRITICO: Genera i movimenti di magazzino
 */
export function useConfirmDdt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ddtsApi.confirm(id),
    onSuccess: () => {
      // Invalida TUTTO perché genera movimenti e aggiorna inventario
      queryClient.invalidateQueries({ queryKey: ddtKeys.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('DDT confermato con successo', {
        description: 'I movimenti di magazzino sono stati generati',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante la conferma del DDT';
      toast.error(message);
    },
  });
}

/**
 * Hook per annullare un DDT
 * ⚠️ CRITICO: Annulla i movimenti di magazzino
 */
export function useCancelDdt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      ddtsApi.cancel(id, reason),
    onSuccess: () => {
      // Invalida TUTTO perché annulla movimenti e ripristina inventario
      queryClient.invalidateQueries({ queryKey: ddtKeys.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('DDT annullato con successo', {
        description: 'I movimenti di magazzino sono stati annullati',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante l\'annullamento del DDT';
      toast.error(message);
    },
  });
}

/**
 * Hook per consegnare un DDT
 * ⚠️ CRITICO: Aggiorna site_materials
 */
export function useDeliverDdt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ddtsApi.deliver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ddtKeys.all });
      queryClient.invalidateQueries({ queryKey: ['site-materials'] });
      toast.success('DDT consegnato con successo');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore durante la consegna del DDT';
      toast.error(message);
    },
  });
}
