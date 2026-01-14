import apiClient from './client';
import type {
  Supplier,
  SupplierFormData,
  ApiResponse,
  PaginatedResponse,
  ContractorRate,
  Worker,
  SupplierType,
  PersonnelType
} from '@/lib/types';

export interface SuppliersParams {
  page?: number;
  per_page?: number;
  search?: string;
  supplier_type?: SupplierType;
  personnel_type?: PersonnelType;
  is_active?: boolean;
  specialization?: string;
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

  // Statistics
  getStatistics: async (id: number): Promise<any> => {
    const { data } = await apiClient.get(`/suppliers/${id}/statistics`);
    return data.data;
  },

  // Rates (for personnel suppliers)
  getRates: async (supplierId: number): Promise<ContractorRate[]> => {
    const { data } = await apiClient.get(`/suppliers/${supplierId}/rates`);
    return data.data;
  },

  getCurrentRate: async (supplierId: number, params: {
    service_type: string;
    date?: string;
  }): Promise<ContractorRate> => {
    const { data } = await apiClient.get(`/suppliers/${supplierId}/rates/current`, { params });
    return data.data;
  },

  createRate: async (supplierId: number, rateData: {
    service_type: string;
    rate_type: string;
    rate_amount: number;
    currency?: string;
    minimum_hours?: number;
    minimum_amount?: number;
    is_forfait?: boolean;
    valid_from: string;
    notes?: string;
  }): Promise<ContractorRate> => {
    const { data } = await apiClient.post(`/suppliers/${supplierId}/rates`, rateData);
    return data.data;
  },

  getRateHistory: async (supplierId: number, params?: {
    service_type?: string;
  }): Promise<ContractorRate[]> => {
    const { data } = await apiClient.get(`/suppliers/${supplierId}/rates/history`, { params });
    return data.data;
  },

  // Workers (for personnel suppliers)
  getWorkers: async (supplierId: number): Promise<Worker[]> => {
    const { data } = await apiClient.get(`/suppliers/${supplierId}/workers`);
    return data.data;
  },
};
