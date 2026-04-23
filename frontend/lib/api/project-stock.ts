import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types';
import type { ProjectStockItem, ProjectStockSummary } from '@/lib/types';

export const projectStockApi = {
  getStock: async (projectId: number): Promise<ProjectStockItem[]> => {
    const response = await apiClient.get<ApiResponse<ProjectStockItem[]>>(
      `/projects/${projectId}/stock`
    );
    return response.data.data;
  },

  getStockSummary: async (projectId: number): Promise<ProjectStockSummary> => {
    const response = await apiClient.get<ApiResponse<ProjectStockSummary>>(
      `/projects/${projectId}/stock-summary`
    );
    return response.data.data;
  },
};
