import { apiClient } from './client';

export const siteMaterialsApi = {
  getAll: async (siteId: number, params?: { product_type?: 'physical' | 'service' | 'kit' }) => {
    const response = await apiClient.get(`/sites/${siteId}/materials`, { params });
    return response.data.data;
  },

  create: async (siteId: number, data: {
    material_id: number;
    planned_quantity: number;
    planned_unit_cost: number;
    quote_item_id?: number;
    required_date?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post(`/sites/${siteId}/materials`, data);
    return response.data.data;
  },

  update: async (siteId: number, materialId: number, data: any) => {
    const response = await apiClient.patch(`/sites/${siteId}/materials/${materialId}`, data);
    return response.data.data;
  },

  delete: async (siteId: number, materialId: number) => {
    const response = await apiClient.delete(`/sites/${siteId}/materials/${materialId}`);
    return response.data;
  },

  logUsage: async (siteId: number, materialId: number, data: {
    quantity_used: number;
    actual_unit_cost?: number;
    notes?: string;
  }) => {
    const response = await apiClient.post(`/sites/${siteId}/materials/${materialId}/log-usage`, data);
    return response.data.data;
  },

  reserve: async (siteId: number, materialId: number, data: {
    warehouse_id: number;
    quantity: number;
  }) => {
    const response = await apiClient.post(`/sites/${siteId}/materials/${materialId}/reserve`, data);
    return response.data.data;
  },

  deliver: async (siteId: number, materialId: number, data: {
    warehouse_id: number;
    quantity: number;
    delivery_date?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post(`/sites/${siteId}/materials/${materialId}/deliver`, data);
    return response.data.data;
  },

  returnMaterial: async (siteId: number, materialId: number, data: {
    warehouse_id: number;
    quantity: number;
    notes?: string;
  }) => {
    const response = await apiClient.post(`/sites/${siteId}/materials/${materialId}/return`, data);
    return response.data.data;
  },

  transferToSite: async (siteId: number, materialId: number, data: {
    to_site_id: number;
    quantity: number;
    ddt_number?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post(`/sites/${siteId}/materials/${materialId}/transfer`, data);
    return response.data.data;
  },
};
