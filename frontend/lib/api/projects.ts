import apiClient from './client';
import { Project, ProjectFormData, ApiResponse, PaginatedResponse, FinalBalance, ProjectScheduleDayStatus } from '@/lib/types';

export interface ConvocazioneEntry {
  id: number;
  project_worker_id: number;
  worker_id: number | null;
  worker_name: string | null;
  role_name: string | null;
  scheduled_date: string;
  planned_start_time: string | null;
  planned_end_time: string | null;
  planned_hours: number | null;
  effective_planned_hours: number;
  status: ProjectScheduleDayStatus;
  notes: string | null;
}

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

  getFinalBalance: async (projectId: number): Promise<FinalBalance> => {
    const { data } = await apiClient.get<ApiResponse<FinalBalance>>(
      `/projects/${projectId}/final-balance`
    );
    return data.data;
  },

  getOvertimeSummary: async (projectId: number): Promise<import('@/lib/types').OvertimeSummary> => {
    const { data } = await apiClient.get<ApiResponse<import('@/lib/types').OvertimeSummary>>(
      `/projects/${projectId}/overtime-summary`
    );
    return data.data;
  },

  getProjectServices: async (projectId: number): Promise<import('@/lib/types').ProjectService[]> => {
    const { data } = await apiClient.get<ApiResponse<import('@/lib/types').ProjectService[]>>(
      `/projects/${projectId}/services`
    );
    return data.data;
  },

  getWorkerSchedules: async (projectId: number): Promise<ConvocazioneEntry[]> => {
    const { data } = await apiClient.get<ApiResponse<ConvocazioneEntry[]>>(
      `/projects/${projectId}/schedules`
    );
    return data.data;
  },
};
