import { apiClient } from './client';

export const inventoryApi = {
  // GET /api/v1/inventory
  getAll: async (params?: {
    warehouse_id?: number;
    product_id?: number;
    low_stock?: boolean;
    search?: string;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/inventory', { params });
    return response.data;
  },

  // GET /api/v1/inventory/{id}
  getById: async (id: number) => {
    const response = await apiClient.get(`/inventory/${id}`);
    return response.data.data;
  },

  // GET /api/v1/inventory/warehouse/{warehouseId}
  getByWarehouse: async (warehouseId: number) => {
    const response = await apiClient.get(`/inventory/warehouse/${warehouseId}`);
    return response.data.data;
  },

  // GET /api/v1/inventory/product/{productId}
  getByProduct: async (productId: number) => {
    const response = await apiClient.get(`/inventory/product/${productId}`);
    return response.data.data;
  },

  // GET /api/v1/inventory/low-stock
  getLowStock: async (warehouseId?: number) => {
    const response = await apiClient.get('/inventory/low-stock', {
      params: { warehouse_id: warehouseId },
    });
    return response.data.data;
  },

  // GET /api/v1/inventory/valuation
  getValuation: async (warehouseId?: number) => {
    const response = await apiClient.get('/inventory/valuation', {
      params: { warehouse_id: warehouseId },
    });
    return response.data.data;
  },

  // POST /api/v1/inventory/adjust
  adjustStock: async (data: App.Data.InventoryData) => {
    const response = await apiClient.post('/inventory/adjust', data);
    return response.data.data;
  },

  // PUT /api/v1/inventory/{id}/minimum-stock
  updateMinimumStock: async (id: number, minimumStock: number) => {
    const response = await apiClient.put(`/inventory/${id}/minimum-stock`, {
      minimum_stock: minimumStock,
    });
    return response.data.data;
  },

  // PUT /api/v1/inventory/{id}/maximum-stock
  updateMaximumStock: async (id: number, maximumStock: number) => {
    const response = await apiClient.put(`/inventory/${id}/maximum-stock`, {
      maximum_stock: maximumStock,
    });
    return response.data.data;
  },
};
