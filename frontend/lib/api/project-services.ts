import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';
import type {
  ProjectService,
  CreateProjectServiceInput,
  UpdateProjectServiceInput,
  AssignWorkerToServiceInput,
} from '@/lib/types';

export const projectServicesApi = {
  getByProject: async (projectId: number): Promise<ProjectService[]> => {
    const response = await apiClient.get<ApiResponse<ProjectService[]>>(
      `/projects/${projectId}/services`
    );
    return response.data.data;
  },

  create: async (
    projectId: number,
    data: CreateProjectServiceInput
  ): Promise<ProjectService> => {
    const response = await apiClient.post<ApiResponse<ProjectService>>(
      `/projects/${projectId}/services`,
      data
    );
    return response.data.data;
  },

  getById: async (id: number): Promise<ProjectService> => {
    const response = await apiClient.get<ApiResponse<ProjectService>>(
      `/project-services/${id}`
    );
    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdateProjectServiceInput
  ): Promise<ProjectService> => {
    const response = await apiClient.put<ApiResponse<ProjectService>>(
      `/project-services/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/project-services/${id}`);
  },

  assignWorkers: async (
    id: number,
    data: AssignWorkerToServiceInput
  ): Promise<ProjectService> => {
    const response = await apiClient.post<ApiResponse<ProjectService>>(
      `/project-services/${id}/assign-workers`,
      data
    );
    return response.data.data;
  },

  removeWorker: async (
    serviceId: number,
    projectWorkerId: number
  ): Promise<void> => {
    await apiClient.delete(
      `/project-services/${serviceId}/workers/${projectWorkerId}`
    );
  },
};
