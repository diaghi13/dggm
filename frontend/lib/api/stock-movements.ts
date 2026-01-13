import { apiClient } from './client';

export const stockMovementsApi = {
  getAll: async (params?: {
    warehouse_id?: number;
    material_id?: number;
    site_id?: number;
    type?: string;
    start_date?: string;
    end_date?: string;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/stock-movements', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/stock-movements/${id}`);
    return response.data.data;
  },

  createIntake: async (data: {
    material_id: number;
    warehouse_id: number;
    quantity: number;
    unit_cost?: number;
    supplier_id?: number;
    supplier_document?: string;
    movement_date: string;
    notes?: string;
  }) => {
    const response = await apiClient.post('/stock-movements/intake', data);
    return response.data.data;
  },

  createOutput: async (data: {
    material_id: number;
    warehouse_id: number;
    quantity: number;
    site_id?: number;
    movement_date: string;
    notes?: string;
  }) => {
    const response = await apiClient.post('/stock-movements/output', data);
    return response.data.data;
  },

  createTransfer: async (data: {
    material_id: number;
    from_warehouse_id: number;
    to_warehouse_id: number;
    quantity: number;
    movement_date: string;
    notes?: string;
  }) => {
    const response = await apiClient.post('/stock-movements/transfer', data);
    return response.data.data;
  },

  createAdjustment: async (data: {
    material_id: number;
    warehouse_id: number;
    quantity: number;
    movement_date: string;
    notes?: string;
  }) => {
    const response = await apiClient.post('/stock-movements/adjustment', data);
    return response.data.data;
  },
};
