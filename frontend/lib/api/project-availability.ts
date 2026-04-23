import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';
import type {
  ProjectAvailabilityCheck,
  ResolveAvailabilityItemInput,
} from '@/lib/types';

export const projectAvailabilityApi = {
  runCheck: async (projectId: number): Promise<ProjectAvailabilityCheck> => {
    const response = await apiClient.post<ApiResponse<ProjectAvailabilityCheck>>(
      `/projects/${projectId}/availability-check`
    );
    return response.data.data;
  },

  getChecks: async (projectId: number): Promise<ProjectAvailabilityCheck[]> => {
    const response = await apiClient.get<ApiResponse<ProjectAvailabilityCheck[]>>(
      `/projects/${projectId}/availability-checks`
    );
    return response.data.data;
  },

  getLatest: async (projectId: number): Promise<ProjectAvailabilityCheck> => {
    const response = await apiClient.get<ApiResponse<ProjectAvailabilityCheck>>(
      `/projects/${projectId}/availability-checks/latest`
    );
    return response.data.data;
  },

  resolveItem: async (
    itemId: number,
    data: ResolveAvailabilityItemInput
  ): Promise<void> => {
    await apiClient.patch(`/project-availability-items/${itemId}/resolve`, data);
  },
};
