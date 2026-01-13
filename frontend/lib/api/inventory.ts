import { apiClient } from './client';

export const inventoryApi = {
  getAll: async (params?: {
    warehouse_id?: number;
    material_id?: number;
    low_stock?: boolean;
    search?: string;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/inventory', { params });
    return response.data;
  },

  getLowStock: async () => {
    const response = await apiClient.get('/inventory/low-stock');
    return response.data.data;
  },

  getValuation: async (params?: { warehouse_id?: number }) => {
    const response = await apiClient.get('/inventory/valuation', { params });
    return response.data.data;
  },

  adjustStock: async (data: {
    material_id: number;
    warehouse_id: number;
    quantity: number;
    type: 'add' | 'remove';
    notes?: string;
  }) => {
    const response = await apiClient.post('/inventory/adjust', data);
    return response.data.data;
  },
};
