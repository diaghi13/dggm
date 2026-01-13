import apiClient from './client';
import { Site, SiteFormData, ApiResponse, PaginatedResponse } from '@/lib/types';

export interface SitesParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: 'draft' | 'planned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  customer_id?: number;
  project_manager_id?: number;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const sitesApi = {
  getAll: async (params?: SitesParams): Promise<PaginatedResponse<Site>> => {
    const { data } = await apiClient.get<PaginatedResponse<Site>>('/sites', { params });
    return data;
  },

  getById: async (id: number): Promise<Site> => {
    const { data } = await apiClient.get<ApiResponse<Site>>(`/sites/${id}`);
    return data.data;
  },

  create: async (site: SiteFormData): Promise<Site> => {
    const { data } = await apiClient.post<ApiResponse<Site>>('/sites', site);
    return data.data;
  },

  update: async (id: number, site: Partial<SiteFormData>): Promise<Site> => {
    const { data } = await apiClient.put<ApiResponse<Site>>(`/sites/${id}`, site);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/sites/${id}`);
  },

  // Media methods
  uploadMedia: async (siteId: number, formData: FormData): Promise<any> => {
    const { data } = await apiClient.post(`/media/sites/${siteId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data;
  },

  downloadMedia: async (mediaId: number): Promise<Blob> => {
    const { data } = await apiClient.get(`/media/${mediaId}/download`, {
      responseType: 'blob',
    });
    return data;
  },

  deleteMedia: async (mediaId: number): Promise<void> => {
    await apiClient.delete(`/media/${mediaId}`);
  },

  // DDT methods
  getDdts: async (siteId: number, params?: { status?: string; type?: string }): Promise<any> => {
    const { data } = await apiClient.get(`/sites/${siteId}/ddts`, { params });
    return data;
  },

  confirmDdt: async (siteId: number, ddtId: number): Promise<any> => {
    const { data } = await apiClient.post(`/sites/${siteId}/ddts/${ddtId}/confirm`);
    return data;
  },

  confirmMultipleDdts: async (siteId: number, ddtIds: number[]): Promise<any> => {
    const { data } = await apiClient.post(`/sites/${siteId}/ddts/confirm-multiple`, { ddt_ids: ddtIds });
    return data;
  },
};
