import apiClient from './client';
import { Project, ProjectFormData, ApiResponse, PaginatedResponse } from '@/lib/types';

export interface ProjectsParams {
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

export const projectsApi = {
  getAll: async (params?: ProjectsParams): Promise<PaginatedResponse<Project>> => {
    const { data } = await apiClient.get<PaginatedResponse<Project>>('/projects', { params });
    return data;
  },

  getById: async (id: number): Promise<Project> => {
    const { data } = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
    return data.data;
  },

  create: async (project: ProjectFormData): Promise<Project> => {
    const { data } = await apiClient.post<ApiResponse<Project>>('/projects', project);
    return data.data;
  },

  update: async (id: number, project: Partial<ProjectFormData>): Promise<Project> => {
    const { data } = await apiClient.put<ApiResponse<Project>>(`/projects/${id}`, project);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  // Media methods
  uploadMedia: async (projectId: number, formData: FormData): Promise<any> => {
    const { data } = await apiClient.post(`/media/projects/${projectId}`, formData, {
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
  getDdts: async (projectId: number, params?: { status?: string; type?: string }): Promise<any> => {
    const { data } = await apiClient.get(`/projects/${projectId}/ddts`, { params });
    return data;
  },

  confirmDdt: async (projectId: number, ddtId: number): Promise<any> => {
    const { data } = await apiClient.post(`/projects/${projectId}/ddts/${ddtId}/confirm`);
    return data;
  },

  confirmMultipleDdts: async (projectId: number, ddtIds: number[]): Promise<any> => {
    const { data } = await apiClient.post(`/projects/${projectId}/ddts/confirm-multiple`, { ddt_ids: ddtIds });
    return data;
  },
};
