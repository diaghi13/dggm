import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, Contractor, ContractorFormData, ContractorRate } from '../types';

export const contractorsApi = {
  getAll: async (params?: {
    search?: string;
    contractor_type?: string;
    is_active?: boolean;
    specialization?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Contractor>> => {
    const response = await apiClient.get('/contractors', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Contractor> => {
    const response = await apiClient.get(`/contractors/${id}`);
    return response.data.data;
  },

  create: async (data: ContractorFormData): Promise<Contractor> => {
    const response = await apiClient.post('/contractors', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<ContractorFormData>): Promise<Contractor> => {
    const response = await apiClient.put(`/contractors/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/contractors/${id}`);
    return response.data;
  },

  getStatistics: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/contractors/${id}/statistics`);
    return response.data.data;
  },

  getPendingInvoices: async (id: number): Promise<any[]> => {
    const response = await apiClient.get(`/contractors/${id}/pending-invoices`);
    return response.data.data;
  },

  // Rates
  getRates: async (contractorId: number): Promise<ContractorRate[]> => {
    const response = await apiClient.get(`/contractors/${contractorId}/rates`);
    return response.data.data;
  },

  getCurrentRate: async (contractorId: number, params: {
    service_type: string;
    date?: string;
  }): Promise<ContractorRate> => {
    const response = await apiClient.get(`/contractors/${contractorId}/rates/current`, { params });
    return response.data.data;
  },

  createRate: async (contractorId: number, data: {
    service_type: string;
    rate_type: string;
    rate_amount: number;
    currency?: string;
    minimum_hours?: number;
    minimum_amount?: number;
    valid_from: string;
    notes?: string;
  }): Promise<ContractorRate> => {
    const response = await apiClient.post(`/contractors/${contractorId}/rates`, data);
    return response.data.data;
  },

  getRateHistory: async (contractorId: number, params?: {
    service_type?: string;
  }): Promise<ContractorRate[]> => {
    const response = await apiClient.get(`/contractors/${contractorId}/rates/history`, { params });
    return response.data.data;
  },
};
