import { apiClient } from './client';

// Tipo per la creazione di un DDT (solo campi input, senza computed properties)
export type CreateDdtInput = {
  type: App.Enums.DdtType;
  ddt_number: string;
  ddt_date: string;
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  supplier_id?: number;
  customer_id?: number;
  site_id?: number;
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
    product_id: number;
    quantity: number;
    unit: string;
    unit_cost?: number;
    notes?: string;
  }>;
};

// Tipo per l'aggiornamento di un DDT (tutti i campi opzionali tranne items se forniti)
export type UpdateDdtInput = Partial<Omit<CreateDdtInput, 'type'>>;

export const ddtsApi = {
  // GET /api/v1/ddts
  getAll: async (params?: {
    type?: string;
    status?: string;
    warehouse_id?: number;
    site_id?: number;
    supplier_id?: number;
    customer_id?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
  }) => {
    const response = await apiClient.get('/ddts', { params });
    return response.data;
  },

  // GET /api/v1/ddts/{id}
  getById: async (id: number) => {
    const response = await apiClient.get(`/ddts/${id}`);
    return response.data.data;
  },

  // POST /api/v1/ddts
  create: async (data: CreateDdtInput) => {
    const response = await apiClient.post('/ddts', data);
    return response.data.data;
  },

  // PUT /api/v1/ddts/{id}
  update: async (id: number, data: UpdateDdtInput) => {
    const response = await apiClient.put(`/ddts/${id}`, data);
    return response.data.data;
  },

  // DELETE /api/v1/ddts/{id}
  delete: async (id: number) => {
    const response = await apiClient.delete(`/ddts/${id}`);
    return response.data;
  },

  // POST /api/v1/ddts/{id}/confirm
  confirm: async (id: number) => {
    const response = await apiClient.post(`/ddts/${id}/confirm`);
    return response.data.data;
  },

  // POST /api/v1/ddts/{id}/cancel
  cancel: async (id: number, reason: string) => {
    const response = await apiClient.post(`/ddts/${id}/cancel`, { reason });
    return response.data.data;
  },

  // POST /api/v1/ddts/{id}/deliver
  deliver: async (id: number) => {
    const response = await apiClient.post(`/ddts/${id}/deliver`);
    return response.data.data;
  },

  // GET /api/v1/ddts/site/{siteId}/active
  getActiveBySite: async (siteId: number) => {
    const response = await apiClient.get(`/ddts/site/${siteId}/active`);
    return response.data.data;
  },

  // GET /api/v1/ddts/pending-rentals
  getPendingRentals: async (warehouseId?: number) => {
    const response = await apiClient.get('/ddts/pending-rentals', {
      params: { warehouse_id: warehouseId },
    });
    return response.data.data;
  },

  // GET /api/v1/ddts/next-number
  getNextNumber: async () => {
    const response = await apiClient.get('/ddts/next-number');
    return response.data.data;
  },
};
