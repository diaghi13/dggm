import apiClient from './client';
import { Supplier, SupplierFormData, ApiResponse, PaginatedResponse } from '@/lib/types';

export interface SuppliersParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const suppliersApi = {
  getAll: async (params?: SuppliersParams): Promise<PaginatedResponse<Supplier>> => {
    const { data } = await apiClient.get<PaginatedResponse<Supplier>>('/suppliers', { params });
    return data;
  },

  getById: async (id: number): Promise<Supplier> => {
    const { data } = await apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return data.data;
  },

  create: async (supplier: SupplierFormData): Promise<Supplier> => {
    const { data } = await apiClient.post<ApiResponse<Supplier>>('/suppliers', supplier);
    return data.data;
  },

  update: async (id: number, supplier: Partial<SupplierFormData>): Promise<Supplier> => {
    const { data } = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, supplier);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`);
  },
};
