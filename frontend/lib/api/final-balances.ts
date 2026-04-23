import { apiClient } from '@/lib/api/client';
import type { ApiResponse, PaginatedResponse } from '@/lib/types';
import type {
  FinalBalanceDoc,
  FinalBalanceItem,
  GenerateFinalBalanceInput,
  CreateFinalBalanceInput,
  UpdateFinalBalanceInput,
  CreateFinalBalanceItemInput,
  UpdateFinalBalanceItemInput,
} from '@/lib/types';

export const finalBalancesApi = {
  getAll: async (params?: {
    status?: string;
    project_id?: number;
    customer_id?: number;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<FinalBalanceDoc>> => {
    const response = await apiClient.get<PaginatedResponse<FinalBalanceDoc>>(
      `/final-balances`,
      { params }
    );
    return response.data;
  },

  getByProject: async (projectId: number): Promise<FinalBalanceDoc[]> => {
    const response = await apiClient.get<ApiResponse<FinalBalanceDoc[]>>(
      `/projects/${projectId}/final-balances`
    );
    return response.data.data;
  },

  generate: async (
    projectId: number,
    data: GenerateFinalBalanceInput
  ): Promise<FinalBalanceDoc> => {
    const response = await apiClient.post<ApiResponse<FinalBalanceDoc>>(
      `/projects/${projectId}/final-balances/generate`,
      data
    );
    return response.data.data;
  },

  create: async (data: CreateFinalBalanceInput): Promise<FinalBalanceDoc> => {
    const response = await apiClient.post<ApiResponse<FinalBalanceDoc>>(
      `/final-balances`,
      data
    );
    return response.data.data;
  },

  getById: async (id: number): Promise<FinalBalanceDoc> => {
    const response = await apiClient.get<ApiResponse<FinalBalanceDoc>>(
      `/final-balances/${id}`
    );
    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdateFinalBalanceInput
  ): Promise<FinalBalanceDoc> => {
    const response = await apiClient.put<ApiResponse<FinalBalanceDoc>>(
      `/final-balances/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/final-balances/${id}`);
  },

  finalize: async (id: number): Promise<FinalBalanceDoc> => {
    const response = await apiClient.post<ApiResponse<FinalBalanceDoc>>(
      `/final-balances/${id}/finalize`
    );
    return response.data.data;
  },

  approve: async (id: number): Promise<FinalBalanceDoc> => {
    const response = await apiClient.post<ApiResponse<FinalBalanceDoc>>(
      `/final-balances/${id}/approve`
    );
    return response.data.data;
  },

  getNextNumber: async (): Promise<{ code: string }> => {
    const response = await apiClient.get<ApiResponse<{ code: string }>>(
      `/final-balances/next-number`
    );
    return response.data.data;
  },

  // Items
  addItem: async (
    finalBalanceId: number,
    data: CreateFinalBalanceItemInput
  ): Promise<FinalBalanceItem> => {
    const response = await apiClient.post<ApiResponse<FinalBalanceItem>>(
      `/final-balances/${finalBalanceId}/items`,
      data
    );
    return response.data.data;
  },

  updateItem: async (
    itemId: number,
    data: UpdateFinalBalanceItemInput
  ): Promise<FinalBalanceItem> => {
    const response = await apiClient.put<ApiResponse<FinalBalanceItem>>(
      `/final-balance-items/${itemId}`,
      data
    );
    return response.data.data;
  },

  deleteItem: async (itemId: number): Promise<void> => {
    await apiClient.delete(`/final-balance-items/${itemId}`);
  },

  reorderItem: async (
    itemId: number,
    sortOrder: number
  ): Promise<FinalBalanceItem> => {
    const response = await apiClient.patch<ApiResponse<FinalBalanceItem>>(
      `/final-balance-items/${itemId}/reorder`,
      { sort_order: sortOrder }
    );
    return response.data.data;
  },
};
