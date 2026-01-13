import apiClient from './client';
import { Customer, CustomerFormData, ApiResponse, PaginatedResponse } from '@/lib/types';

export interface CustomersParams {
  page?: number;
  per_page?: number;
  search?: string;
  type?: 'individual' | 'company';
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const customersApi = {
  getAll: async (params?: CustomersParams): Promise<PaginatedResponse<Customer>> => {
    const { data } = await apiClient.get<PaginatedResponse<Customer>>('/customers', { params });
    return data;
  },

  getById: async (id: number): Promise<Customer> => {
    const { data } = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return data.data;
  },

  create: async (customer: CustomerFormData): Promise<Customer> => {
    const { data } = await apiClient.post<ApiResponse<Customer>>('/customers', customer);
    return data.data;
  },

  update: async (id: number, customer: Partial<CustomerFormData>): Promise<Customer> => {
    const { data } = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, customer);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
};
