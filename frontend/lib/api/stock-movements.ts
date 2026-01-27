import { apiClient } from './client';

export const stockMovementsApi = {
  // GET /api/v1/stock-movements
  getAll: async (params?: {
    product_id?: number;
    warehouse_id?: number;
    site_id?: number;
    type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/stock-movements', { params });
    return response.data;
  },

  // GET /api/v1/stock-movements/{id}
  getById: async (id: number) => {
    const response = await apiClient.get(`/stock-movements/${id}`);
    return response.data.data;
  },

  // GET /api/v1/stock-movements/product/{productId}
  getByProduct: async (productId: number, limit?: number) => {
    const response = await apiClient.get(`/stock-movements/product/${productId}`, {
      params: { limit },
    });
    return response.data.data;
  },

  // GET /api/v1/stock-movements/warehouse/{warehouseId}
  getByWarehouse: async (warehouseId: number) => {
    const response = await apiClient.get(`/stock-movements/warehouse/${warehouseId}`);
    return response.data.data;
  },

  // GET /api/v1/stock-movements/rental-history
  getRentalHistory: async (params?: {
    product_id?: number;
    site_id?: number;
    active_only?: boolean;
  }) => {
    const response = await apiClient.get('/stock-movements/rental-history', { params });
    return response.data.data;
  },

  // POST /api/v1/stock-movements/intake
  createIntake: async (data: {
    warehouse_id: number;
    product_id: number;
    quantity: number;
    unit_cost?: number;
    reference?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post('/stock-movements/intake', data);
    return response.data.data;
  },

  // POST /api/v1/stock-movements/output
  createOutput: async (data: {
    warehouse_id: number;
    product_id: number;
    quantity: number;
    reason?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post('/stock-movements/output', data);
    return response.data.data;
  },

  // POST /api/v1/stock-movements/transfer
  createTransfer: async (data: {
    from_warehouse_id: number;
    to_warehouse_id: number;
    product_id: number;
    quantity: number;
    notes?: string;
  }) => {
    const response = await apiClient.post('/stock-movements/transfer', data);
    return response.data.data;
  },
};
