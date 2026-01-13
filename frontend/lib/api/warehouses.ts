import { apiClient } from './client';

export const warehousesApi = {
  getAll: async (params?: {
    is_active?: boolean;
    type?: string;
    search?: string;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/warehouses', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/warehouses/${id}`);
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/warehouses', data);
    return response.data.data;
  },

  update: async (id: number, data: any) => {
    const response = await apiClient.patch(`/warehouses/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/warehouses/${id}`);
    return response.data;
  },

  getInventory: async (id: number, params?: {
    low_stock?: boolean;
    search?: string;
  }) => {
    const response = await apiClient.get(`/warehouses/${id}/inventory`, { params });
    return response.data.data;
  },
};
