import { apiClient } from './client';
import type { ApiResponse, SiteLaborCost, Worker } from '../types';

export const siteLaborCostsApi = {
  getAll: async (siteId: number, params?: {
    cost_type?: string;
    month?: number;
    year?: number;
  }): Promise<SiteLaborCost[]> => {
    const response = await apiClient.get(`/sites/${siteId}/labor-costs`, { params });
    return response.data.data;
  },

  create: async (siteId: number, data: {
    cost_type: string;
    worker_id?: number;
    contractor_id?: number;
    description: string;
    work_date: string;
    hours_worked?: number;
    quantity?: number;
    unit_rate?: number;
    total_cost?: number;
    currency?: string;
    is_overtime?: boolean;
    is_holiday?: boolean;
    cost_category?: string;
    invoice_number?: string;
    invoice_date?: string;
    is_invoiced?: boolean;
    notes?: string;
  }): Promise<SiteLaborCost> => {
    const response = await apiClient.post(`/sites/${siteId}/labor-costs`, data);
    return response.data.data;
  },

  update: async (siteId: number, laborCostId: number, data: Partial<{
    description: string;
    work_date: string;
    hours_worked: number;
    quantity: number;
    unit_rate: number;
    total_cost: number;
    is_overtime: boolean;
    is_holiday: boolean;
    cost_category: string;
    invoice_number: string;
    invoice_date: string;
    is_invoiced: boolean;
    notes: string;
  }>): Promise<SiteLaborCost> => {
    const response = await apiClient.put(`/sites/${siteId}/labor-costs/${laborCostId}`, data);
    return response.data.data;
  },

  delete: async (siteId: number, laborCostId: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/sites/${siteId}/labor-costs/${laborCostId}`);
    return response.data;
  },

  getBreakdown: async (siteId: number): Promise<any> => {
    const response = await apiClient.get(`/sites/${siteId}/labor-costs/breakdown`);
    return response.data.data;
  },

  getMonthlySummary: async (siteId: number, year: number, month: number): Promise<any> => {
    const response = await apiClient.get(`/sites/${siteId}/labor-costs/monthly`, {
      params: { year, month },
    });
    return response.data.data;
  },

  getByWorker: async (siteId: number): Promise<any[]> => {
    const response = await apiClient.get(`/sites/${siteId}/labor-costs/by-worker`);
    return response.data.data;
  },

  // Site Workers
  getWorkers: async (siteId: number, onlyActive?: boolean): Promise<Worker[]> => {
    const response = await apiClient.get(`/sites/${siteId}/workers`, {
      params: { only_active: onlyActive },
    });
    return response.data.data;
  },

  assignWorker: async (siteId: number, data: {
    worker_id: number;
    site_role?: string;
    assigned_from: string;
    assigned_to?: string;
    hourly_rate_override?: number;
    estimated_hours?: number;
    notes?: string;
  }): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(`/sites/${siteId}/workers`, data);
    return response.data;
  },

  updateWorkerAssignment: async (siteId: number, workerId: number, data: {
    site_role?: string;
    assigned_to?: string;
    hourly_rate_override?: number;
    estimated_hours?: number;
    is_active?: boolean;
    notes?: string;
  }): Promise<ApiResponse<null>> => {
    const response = await apiClient.put(`/sites/${siteId}/workers/${workerId}`, data);
    return response.data;
  },

  removeWorker: async (siteId: number, workerId: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/sites/${siteId}/workers/${workerId}`);
    return response.data;
  },
};
