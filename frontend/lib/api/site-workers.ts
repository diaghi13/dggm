import apiClient from './client';
import {
  ApiResponse,
  SiteWorker,
  SiteWorkerFormData,
  SiteWorkerStatus,
  SiteWorkerConflict,
  SiteRole,
} from '@/lib/types';

export interface SiteWorkersParams {
  status?: SiteWorkerStatus;
  is_active?: boolean;
  from_date?: string;
  to_date?: string;
}

export interface ChangeStatusData {
  status: SiteWorkerStatus;
}

export interface RespondData {
  notes?: string;
  reason?: string;
}

export const siteWorkersApi = {
  // Get workers for a site
  getWorkersBySite: async (siteId: number, params?: SiteWorkersParams): Promise<SiteWorker[]> => {
    const { data } = await apiClient.get<ApiResponse<SiteWorker[]>>(`/sites/${siteId}/workers`, {
      params,
    });
    return data.data;
  },

  // Get sites for a worker
  getSitesByWorker: async (workerId: number, params?: SiteWorkersParams): Promise<SiteWorker[]> => {
    const { data } = await apiClient.get<ApiResponse<SiteWorker[]>>(`/workers/${workerId}/sites`, {
      params,
    });
    return data.data;
  },

  // Assign worker to site
  assignWorker: async (siteId: number, assignmentData: SiteWorkerFormData): Promise<SiteWorker> => {
    const { data } = await apiClient.post<ApiResponse<SiteWorker>>(
      `/sites/${siteId}/workers`,
      assignmentData
    );
    return data.data;
  },

  // Get single assignment
  getAssignment: async (siteWorkerId: number): Promise<SiteWorker> => {
    const { data } = await apiClient.get<ApiResponse<SiteWorker>>(`/site-workers/${siteWorkerId}`);
    return data.data;
  },

  // Update assignment
  updateAssignment: async (
    siteWorkerId: number,
    updateData: Partial<SiteWorkerFormData>
  ): Promise<SiteWorker> => {
    const { data } = await apiClient.put<ApiResponse<SiteWorker>>(
      `/site-workers/${siteWorkerId}`,
      updateData
    );
    return data.data;
  },

  // Worker accepts assignment
  acceptAssignment: async (siteWorkerId: number, notes?: string): Promise<SiteWorker> => {
    const { data } = await apiClient.post<ApiResponse<SiteWorker>>(
      `/site-workers/${siteWorkerId}/accept`,
      { notes }
    );
    return data.data;
  },

  // Worker rejects assignment
  rejectAssignment: async (siteWorkerId: number, reason?: string): Promise<SiteWorker> => {
    const { data } = await apiClient.post<ApiResponse<SiteWorker>>(
      `/site-workers/${siteWorkerId}/reject`,
      { reason }
    );
    return data.data;
  },

  // Change status (PM/Admin)
  changeStatus: async (
    siteWorkerId: number,
    statusData: ChangeStatusData
  ): Promise<SiteWorker> => {
    const { data } = await apiClient.post<ApiResponse<SiteWorker>>(
      `/site-workers/${siteWorkerId}/change-status`,
      statusData
    );
    return data.data;
  },

  // Cancel assignment
  cancelAssignment: async (siteWorkerId: number, reason?: string): Promise<SiteWorker> => {
    const { data } = await apiClient.post<ApiResponse<SiteWorker>>(
      `/site-workers/${siteWorkerId}/cancel`,
      { reason }
    );
    return data.data;
  },

  // Complete assignment
  completeAssignment: async (siteWorkerId: number): Promise<SiteWorker> => {
    const { data } = await apiClient.post<ApiResponse<SiteWorker>>(
      `/site-workers/${siteWorkerId}/complete`
    );
    return data.data;
  },

  // Remove worker from site
  removeWorker: async (siteWorkerId: number): Promise<void> => {
    await apiClient.delete(`/site-workers/${siteWorkerId}`);
  },

  // Check conflicts
  checkConflicts: async (siteWorkerId: number): Promise<SiteWorkerConflict> => {
    const { data } = await apiClient.get<ApiResponse<SiteWorkerConflict>>(
      `/site-workers/${siteWorkerId}/conflicts`
    );
    return data.data;
  },

  // Get effective rate
  getEffectiveRate: async (
    siteWorkerId: number
  ): Promise<{
    effective_rate: number | null;
    hourly_rate_override: number | null;
    fixed_rate_override: number | null;
    rate_override_notes: string | null;
  }> => {
    const { data } = await apiClient.get<
      ApiResponse<{
        effective_rate: number | null;
        hourly_rate_override: number | null;
        fixed_rate_override: number | null;
        rate_override_notes: string | null;
      }>
    >(`/site-workers/${siteWorkerId}/effective-rate`);
    return data.data;
  },

  // Get all site roles
  getRoles: async (): Promise<SiteRole[]> => {
    const { data } = await apiClient.get<ApiResponse<SiteRole[]>>('/site-roles');
    return data.data;
  },
};
