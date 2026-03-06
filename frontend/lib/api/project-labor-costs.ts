import { apiClient } from './client';
import type { ApiResponse, ProjectLaborCost, Worker } from '../types';

export const projectLaborCostsApi = {
  getAll: async (projectId: number, params?: {
    cost_type?: string;
    month?: number;
    year?: number;
  }): Promise<ProjectLaborCost[]> => {
    const response = await apiClient.get(`/projects/${projectId}/labor-costs`, { params });
    return response.data.data;
  },

  create: async (projectId: number, data: {
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
  }): Promise<ProjectLaborCost> => {
    const response = await apiClient.post(`/projects/${projectId}/labor-costs`, data);
    return response.data.data;
  },

  update: async (projectId: number, laborCostId: number, data: Partial<{
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
  }>): Promise<ProjectLaborCost> => {
    const response = await apiClient.put(`/projects/${projectId}/labor-costs/${laborCostId}`, data);
    return response.data.data;
  },

  delete: async (projectId: number, laborCostId: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/projects/${projectId}/labor-costs/${laborCostId}`);
    return response.data;
  },

  getBreakdown: async (projectId: number): Promise<any> => {
    const response = await apiClient.get(`/projects/${projectId}/labor-costs/breakdown`);
    return response.data.data;
  },

  getMonthlySummary: async (projectId: number, year: number, month: number): Promise<any> => {
    const response = await apiClient.get(`/projects/${projectId}/labor-costs/monthly`, {
      params: { year, month },
    });
    return response.data.data;
  },

  getByWorker: async (projectId: number): Promise<any[]> => {
    const response = await apiClient.get(`/projects/${projectId}/labor-costs/by-worker`);
    return response.data.data;
  },

  // Project Workers
  getWorkers: async (projectId: number, onlyActive?: boolean): Promise<Worker[]> => {
    const response = await apiClient.get(`/projects/${projectId}/workers`, {
      params: { only_active: onlyActive },
    });
    return response.data.data;
  },

  assignWorker: async (projectId: number, data: {
    worker_id: number;
    project_role?: string;
    assigned_from: string;
    assigned_to?: string;
    hourly_rate_override?: number;
    estimated_hours?: number;
    notes?: string;
  }): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(`/projects/${projectId}/workers`, data);
    return response.data;
  },

  updateWorkerAssignment: async (projectId: number, workerId: number, data: {
    project_role?: string;
    assigned_to?: string;
    hourly_rate_override?: number;
    estimated_hours?: number;
    is_active?: boolean;
    notes?: string;
  }): Promise<ApiResponse<null>> => {
    const response = await apiClient.put(`/projects/${projectId}/workers/${workerId}`, data);
    return response.data;
  },

  removeWorker: async (projectId: number, workerId: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/projects/${projectId}/workers/${workerId}`);
    return response.data;
  },
};
