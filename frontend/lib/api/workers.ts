import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, Worker, WorkerFormData, WorkerRate, SiteWorkerAssignment } from '../types';

export const workersApi = {
  getAll: async (params?: {
    search?: string;
    worker_type?: string;
    is_active?: boolean;
    specialization?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Worker>> => {
    const response = await apiClient.get('/workers', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Worker> => {
    const response = await apiClient.get(`/workers/${id}`);
    return response.data.data;
  },

  create: async (data: WorkerFormData): Promise<Worker> => {
    const response = await apiClient.post('/workers', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<WorkerFormData>): Promise<Worker> => {
    const response = await apiClient.put(`/workers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/workers/${id}`);
    return response.data;
  },

  deactivate: async (id: number, terminationDate?: string): Promise<Worker> => {
    const response = await apiClient.post(`/workers/${id}/deactivate`, {
      termination_date: terminationDate,
    });
    return response.data.data;
  },

  reactivate: async (id: number): Promise<Worker> => {
    const response = await apiClient.post(`/workers/${id}/reactivate`);
    return response.data.data;
  },

  getStatistics: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/workers/${id}/statistics`);
    return response.data.data;
  },

  getAvailable: async (params?: {
    date?: string;
    site_id?: number;
  }): Promise<Worker[]> => {
    const response = await apiClient.get('/workers/available/list', { params });
    return response.data.data;
  },

  // Rates
  getRates: async (workerId: number): Promise<WorkerRate[]> => {
    const response = await apiClient.get(`/workers/${workerId}/rates`);
    return response.data.data;
  },

  getCurrentRate: async (workerId: number, params: {
    context: string;
    rate_type: string;
    date?: string;
  }): Promise<WorkerRate> => {
    const response = await apiClient.get(`/workers/${workerId}/rates/current`, { params });
    return response.data.data;
  },

  createRate: async (workerId: number, data: {
    rate_type: string;
    context: string;
    rate_amount: number;
    currency?: string;
    project_type?: string;
    overtime_multiplier?: number;
    holiday_multiplier?: number;
    overtime_starts_after_hours?: number;
    overtime_starts_after_time?: string;
    recognizes_overtime?: boolean;
    is_forfait?: boolean;
    valid_from: string;
    notes?: string;
  }): Promise<WorkerRate> => {
    const response = await apiClient.post(`/workers/${workerId}/rates`, data);
    return response.data.data;
  },

  deleteRate: async (workerId: number, rateId: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/workers/${workerId}/rates/${rateId}`);
    return response.data;
  },

  getRateHistory: async (workerId: number, params?: {
    context?: string;
    rate_type?: string;
  }): Promise<WorkerRate[]> => {
    const response = await apiClient.get(`/workers/${workerId}/rates/history`, { params });
    return response.data.data;
  },

  calculateCost: async (workerId: number, params: {
    hours: number;
    is_overtime?: boolean;
    is_holiday?: boolean;
    site_id?: number;
    date?: string;
  }): Promise<any> => {
    const response = await apiClient.post(`/workers/${workerId}/rates/calculate`, params);
    return response.data.data;
  },

  // Sites
  getSites: async (workerId: number): Promise<any[]> => {
    const response = await apiClient.get(`/workers/${workerId}/sites`);
    return response.data.data;
  },

  assignToSite: async (workerId: number, data: {
    site_id: number;
    site_role?: string;
    assigned_from: string;
    assigned_to?: string;
    hourly_rate_override?: number;
    estimated_hours?: number;
    notes?: string;
  }): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(`/workers/${workerId}/sites`, data);
    return response.data;
  },

  removeFromSite: async (workerId: number, siteId: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/workers/${workerId}/sites/${siteId}`);
    return response.data;
  },

  getSiteStatistics: async (workerId: number, siteId: number): Promise<any> => {
    const response = await apiClient.get(`/workers/${workerId}/sites/${siteId}/statistics`);
    return response.data.data;
  },
};
