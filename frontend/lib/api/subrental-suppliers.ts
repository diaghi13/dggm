// TODO: Backend routes for subrental suppliers are not yet implemented.
// Routes to add:
//   GET    /products/{productId}/subrental-suppliers
//   POST   /products/{productId}/subrental-suppliers
//   PUT    /products/{productId}/subrental-suppliers/{id}
//   DELETE /products/{productId}/subrental-suppliers/{id}

import { apiClient } from './client';
import type { ProductSubrentalSupplier } from '@/lib/types';

export interface SubrentalSupplierFormData {
  supplier_id: number;
  day_rate: number;
  reliability_score: number;
  is_preferred?: boolean;
  notes?: string | null;
}

export const subrentalSuppliersApi = {
  /**
   * Recupera i fornitori sub-noleggio configurati per un prodotto
   * GET /products/{productId}/subrental-suppliers
   */
  getAll: async (productId: number): Promise<ProductSubrentalSupplier[]> => {
    const { data } = await apiClient.get<{
      success: boolean;
      data: ProductSubrentalSupplier[];
    }>(`/products/${productId}/subrental-suppliers`);
    return data.data;
  },

  /**
   * Aggiunge un fornitore sub-noleggio a un prodotto
   * POST /products/{productId}/subrental-suppliers
   */
  create: async (
    productId: number,
    formData: SubrentalSupplierFormData,
  ): Promise<ProductSubrentalSupplier> => {
    const { data } = await apiClient.post<{
      success: boolean;
      data: ProductSubrentalSupplier;
    }>(`/products/${productId}/subrental-suppliers`, formData);
    return data.data;
  },

  /**
   * Aggiorna un fornitore sub-noleggio
   * PUT /products/{productId}/subrental-suppliers/{id}
   */
  update: async (
    productId: number,
    id: number,
    formData: Partial<SubrentalSupplierFormData>,
  ): Promise<ProductSubrentalSupplier> => {
    const { data } = await apiClient.put<{
      success: boolean;
      data: ProductSubrentalSupplier;
    }>(`/products/${productId}/subrental-suppliers/${id}`, formData);
    return data.data;
  },

  /**
   * Rimuove un fornitore sub-noleggio da un prodotto
   * DELETE /products/{productId}/subrental-suppliers/{id}
   */
  delete: async (productId: number, id: number): Promise<void> => {
    await apiClient.delete(`/products/${productId}/subrental-suppliers/${id}`);
  },

  /**
   * Alias for delete — removes a subrental supplier from a product
   * DELETE /products/{productId}/subrental-suppliers/{id}
   */
  remove: async (productId: number, id: number): Promise<void> => {
    await apiClient.delete(`/products/${productId}/subrental-suppliers/${id}`);
  },
};
