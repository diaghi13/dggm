import { apiClient } from '@/lib/api/client';
import type { ApiResponse, PaginatedResponse } from '@/lib/types';
import type {
  RepairOrder,
  QuarantinedInventoryItem,
  CreateRepairOrderInput,
  UpdateRepairOrderStatusInput,
} from '@/lib/types';

export const repairOrdersApi = {
  getQuarantined: async (): Promise<QuarantinedInventoryItem[]> => {
    const response = await apiClient.get<ApiResponse<QuarantinedInventoryItem[]>>(
      `/inventory/quarantine`
    );
    return response.data.data;
  },

  getAll: async (params?: {
    status?: string;
    repair_type?: string;
    product_id?: number;
  }): Promise<PaginatedResponse<RepairOrder>> => {
    const response = await apiClient.get<PaginatedResponse<RepairOrder>>(
      `/repair-orders`,
      { params }
    );
    return response.data;
  },

  create: async (data: CreateRepairOrderInput): Promise<RepairOrder> => {
    const response = await apiClient.post<ApiResponse<RepairOrder>>(
      `/repair-orders`,
      data
    );
    return response.data.data;
  },

  getById: async (id: number): Promise<RepairOrder> => {
    const response = await apiClient.get<ApiResponse<RepairOrder>>(
      `/repair-orders/${id}`
    );
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<CreateRepairOrderInput>
  ): Promise<RepairOrder> => {
    const response = await apiClient.put<ApiResponse<RepairOrder>>(
      `/repair-orders/${id}`,
      data
    );
    return response.data.data;
  },

  updateStatus: async (
    id: number,
    data: UpdateRepairOrderStatusInput
  ): Promise<RepairOrder> => {
    const response = await apiClient.patch<ApiResponse<RepairOrder>>(
      `/repair-orders/${id}/status`,
      data
    );
    return response.data.data;
  },

  getRepairHistory: async (productId: number): Promise<RepairOrder[]> => {
    const response = await apiClient.get<ApiResponse<RepairOrder[]>>(
      `/products/${productId}/repair-history`
    );
    return response.data.data;
  },
};
