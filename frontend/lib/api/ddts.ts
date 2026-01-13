import { apiClient } from './client';

export const ddtsApi = {
  getAll: async (params?: {
    type?: string;
    status?: string;
    warehouse_id?: number;
    site_id?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
  }) => {
    const response = await apiClient.get('/ddts', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/ddts/${id}`);
    return response.data.data;
  },

  create: async (data: {
    code?: string;
    type: string;
    supplier_id?: number;
    customer_id?: number;
    site_id?: number;
    from_warehouse_id: number;
    to_warehouse_id?: number;
    ddt_number: string;
    ddt_date: string;
    transport_date?: string;
    carrier_name?: string;
    tracking_number?: string;
    rental_start_date?: string;
    rental_end_date?: string;
    parent_ddt_id?: number;
    return_reason?: string;
    return_notes?: string;
    notes?: string;
    items: Array<{
      material_id: number;
      quantity: number;
      unit: string;
      unit_cost?: number;
      notes?: string;
    }>;
  }) => {
    const response = await apiClient.post('/ddts', data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: {
      code?: string;
      type?: string;
      supplier_id?: number;
      customer_id?: number;
      site_id?: number;
      from_warehouse_id?: number;
      to_warehouse_id?: number;
      ddt_number?: string;
      ddt_date?: string;
      transport_date?: string;
      carrier_name?: string;
      tracking_number?: string;
      rental_start_date?: string;
      rental_end_date?: string;
      return_reason?: string;
      return_notes?: string;
      notes?: string;
      items?: Array<{
        id?: number;
        material_id: number;
        quantity: number;
        unit: string;
        unit_cost?: number;
        notes?: string;
      }>;
    }
  ) => {
    const response = await apiClient.patch(`/ddts/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/ddts/${id}`);
    return response.data;
  },

  confirm: async (id: number) => {
    const response = await apiClient.post(`/ddts/${id}/confirm`);
    return response.data.data;
  },

  cancel: async (id: number) => {
    const response = await apiClient.post(`/ddts/${id}/cancel`);
    return response.data.data;
  },

  markAsDelivered: async (id: number) => {
    const response = await apiClient.post(`/ddts/${id}/mark-delivered`);
    return response.data.data;
  },

  getNextNumber: async () => {
    const response = await apiClient.get('/ddts/next-number');
    return response.data.data;
  },
};
