import { apiClient } from '@/lib/api/client';
import type { ApiResponse, OrderList, SubrentalSupplierEntry } from '@/lib/types';

export const projectOrderListApi = {
  getOrderList: async (projectId: number): Promise<OrderList> => {
    const response = await apiClient.get<ApiResponse<OrderList>>(
      `/projects/${projectId}/order-list`
    );
    return response.data.data;
  },

  addSubrentalAssignment: async (
    projectId: number,
    materialId: number,
    supplierEntryId: number,
    quantity?: number | null,
    quotedPrice?: number | null,
  ): Promise<void> => {
    await apiClient.post(`/projects/${projectId}/materials/${materialId}/subrental-assignments`, {
      subrental_supplier_entry_id: supplierEntryId,
      quantity: quantity ?? null,
      quoted_price: quotedPrice ?? null,
    });
  },

  updateSubrentalAssignment: async (
    projectId: number,
    materialId: number,
    supplierEntryId: number,
    data: { quantity?: number | null; quoted_price?: number | null },
  ): Promise<void> => {
    await apiClient.patch(
      `/projects/${projectId}/materials/${materialId}/subrental-assignments/${supplierEntryId}`,
      data,
    );
  },

  removeSubrentalAssignment: async (
    projectId: number,
    materialId: number,
    supplierEntryId: number,
  ): Promise<void> => {
    await apiClient.delete(
      `/projects/${projectId}/materials/${materialId}/subrental-assignments/${supplierEntryId}`,
    );
  },

  createSubrentalSupplier: async (
    productId: number,
    supplierId: number,
    dayRate?: number | null,
  ): Promise<SubrentalSupplierEntry> => {
    const response = await apiClient.post<ApiResponse<SubrentalSupplierEntry>>(
      `/products/${productId}/subrental-suppliers`,
      { product_id: productId, supplier_id: supplierId, day_rate: dayRate ?? null }
    );
    return response.data.data;
  },
};
