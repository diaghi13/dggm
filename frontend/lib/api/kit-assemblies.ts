import apiClient from './client';
import { KitAssembly, KitAssemblyFormData, ApiResponse, PaginatedResponse } from '@/lib/types';

export interface KitAssembliesParams {
  status?: string;
  active_only?: boolean;
  per_page?: number;
}

export interface DisassembleData {
  warehouse_id?: number | null;
}

export interface AddKitItemData {
  product_id: number;
  quantity: number;
  serial_number?: string | null;
  notes?: string | null;
  warehouse_id?: number | null;
}

export interface UpdateKitAssemblyData {
  name?: string;
  location?: string | null;
  notes?: string | null;
  status?: string;
  warehouse_id?: number | null;
}

export const kitAssembliesApi = {
  getByProduct: async (productId: number, params?: KitAssembliesParams): Promise<PaginatedResponse<KitAssembly>> => {
    const { data } = await apiClient.get<PaginatedResponse<KitAssembly>>(
      `/products/${productId}/kit-assemblies`,
      { params }
    );
    return data;
  },

  create: async (productId: number, assembly: KitAssemblyFormData): Promise<KitAssembly> => {
    const { data } = await apiClient.post<ApiResponse<KitAssembly>>(
      `/products/${productId}/kit-assemblies`,
      assembly
    );
    return data.data;
  },

  getById: async (id: number): Promise<KitAssembly> => {
    const { data } = await apiClient.get<ApiResponse<KitAssembly>>(`/kit-assemblies/${id}`);
    return data.data;
  },

  update: async (id: number, assembly: UpdateKitAssemblyData): Promise<KitAssembly> => {
    const { data } = await apiClient.put<ApiResponse<KitAssembly>>(`/kit-assemblies/${id}`, assembly);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/kit-assemblies/${id}`);
  },

  disassemble: async (id: number, body?: DisassembleData): Promise<KitAssembly> => {
    const { data } = await apiClient.post<ApiResponse<KitAssembly>>(
      `/kit-assemblies/${id}/disassemble`,
      body ?? {}
    );
    return data.data;
  },

  addItem: async (id: number, item: AddKitItemData): Promise<KitAssembly> => {
    const { data } = await apiClient.post<ApiResponse<KitAssembly>>(
      `/kit-assemblies/${id}/items`,
      item
    );
    return data.data;
  },

  removeItem: async (id: number, itemId: number, params?: { warehouse_id?: number | null }): Promise<void> => {
    await apiClient.delete(`/kit-assemblies/${id}/items/${itemId}`, { params });
  },

  updateItem: async (
    assemblyId: number,
    itemId: number,
    data: { quantity?: number; serial_number?: string | null; notes?: string | null },
  ): Promise<KitAssembly> => {
    const { data: response } = await apiClient.patch<ApiResponse<KitAssembly>>(
      `/kit-assemblies/${assemblyId}/items/${itemId}`,
      data,
    );
    return response.data;
  },

  getAvailable: async (productId: number, warehouseId?: number): Promise<PaginatedResponse<KitAssembly>> => {
    const params = new URLSearchParams();
    params.append('status[]', 'assembled');
    params.append('status[]', 'returned');
    if (warehouseId) {
      params.append('warehouse_id', warehouseId.toString());
    }
    const { data } = await apiClient.get<PaginatedResponse<KitAssembly>>(
      `/products/${productId}/kit-assemblies?${params.toString()}`
    );
    return data;
  },
};
