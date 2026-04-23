import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';
import type {
  ProjectMaterialIncident,
  ReportIncidentInput,
  ResolveIncidentInput,
} from '@/lib/types';

export const projectIncidentsApi = {
  getByProject: async (
    projectId: number,
    params?: { status?: string; incident_type?: string }
  ): Promise<ProjectMaterialIncident[]> => {
    const response = await apiClient.get<ApiResponse<ProjectMaterialIncident[]>>(
      `/projects/${projectId}/incidents`,
      { params }
    );
    return response.data.data;
  },

  create: async (
    projectId: number,
    data: ReportIncidentInput
  ): Promise<ProjectMaterialIncident> => {
    const response = await apiClient.post<ApiResponse<ProjectMaterialIncident>>(
      `/projects/${projectId}/incidents`,
      data
    );
    return response.data.data;
  },

  getById: async (id: number): Promise<ProjectMaterialIncident> => {
    const response = await apiClient.get<ApiResponse<ProjectMaterialIncident>>(
      `/project-incidents/${id}`
    );
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<ReportIncidentInput>
  ): Promise<ProjectMaterialIncident> => {
    const response = await apiClient.put<ApiResponse<ProjectMaterialIncident>>(
      `/project-incidents/${id}`,
      data
    );
    return response.data.data;
  },

  resolve: async (
    id: number,
    data: ResolveIncidentInput
  ): Promise<ProjectMaterialIncident> => {
    const response = await apiClient.post<ApiResponse<ProjectMaterialIncident>>(
      `/project-incidents/${id}/resolve`,
      data
    );
    return response.data.data;
  },

  uploadPhoto: async (id: number, formData: FormData): Promise<any> => {
    const response = await apiClient.post(
      `/project-incidents/${id}/media`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data;
  },
};
