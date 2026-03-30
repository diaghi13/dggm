import apiClient from './client';
import {
  ApiResponse,
  ProjectWorker,
  ProjectWorkerFormData,
  ProjectWorkerStatus,
  ProjectWorkerConflict,
  ProjectWorkerSchedule,
  ProjectRole,
} from '@/lib/types';

export interface ProjectWorkersParams {
  status?: ProjectWorkerStatus;
  is_active?: boolean;
  from_date?: string;
  to_date?: string;
}

export interface ChangeStatusData {
  status: ProjectWorkerStatus;
}

export interface RespondData {
  notes?: string;
  reason?: string;
}

export const projectWorkersApi = {
  // Get workers for a project
  getWorkersByProject: async (projectId: number, params?: ProjectWorkersParams): Promise<ProjectWorker[]> => {
    const { data } = await apiClient.get<ApiResponse<ProjectWorker[]>>(`/projects/${projectId}/workers`, {
      params,
    });
    return data.data;
  },

  // Get projects for a worker
  getProjectsByWorker: async (workerId: number, params?: ProjectWorkersParams): Promise<ProjectWorker[]> => {
    const { data } = await apiClient.get<ApiResponse<ProjectWorker[]>>(`/workers/${workerId}/projects`, {
      params,
    });
    return data.data;
  },

  // Assign worker to project
  assignWorker: async (projectId: number, assignmentData: ProjectWorkerFormData): Promise<ProjectWorker> => {
    const { data } = await apiClient.post<ApiResponse<ProjectWorker>>(
      `/projects/${projectId}/workers`,
      assignmentData
    );
    return data.data;
  },

  // Get single assignment
  getAssignment: async (projectWorkerId: number): Promise<ProjectWorker> => {
    const { data } = await apiClient.get<ApiResponse<ProjectWorker>>(`/project-workers/${projectWorkerId}`);
    return data.data;
  },

  // Update assignment
  updateAssignment: async (
    projectWorkerId: number,
    updateData: Partial<ProjectWorkerFormData>
  ): Promise<ProjectWorker> => {
    const { data } = await apiClient.put<ApiResponse<ProjectWorker>>(
      `/project-workers/${projectWorkerId}`,
      updateData
    );
    return data.data;
  },

  // Worker accepts assignment
  acceptAssignment: async (projectWorkerId: number, notes?: string): Promise<ProjectWorker> => {
    const { data } = await apiClient.post<ApiResponse<ProjectWorker>>(
      `/project-workers/${projectWorkerId}/accept`,
      { notes }
    );
    return data.data;
  },

  // Worker rejects assignment
  rejectAssignment: async (projectWorkerId: number, reason?: string): Promise<ProjectWorker> => {
    const { data } = await apiClient.post<ApiResponse<ProjectWorker>>(
      `/project-workers/${projectWorkerId}/reject`,
      { reason }
    );
    return data.data;
  },

  // Change status (PM/Admin)
  changeStatus: async (
    projectWorkerId: number,
    statusData: ChangeStatusData
  ): Promise<ProjectWorker> => {
    const { data } = await apiClient.post<ApiResponse<ProjectWorker>>(
      `/project-workers/${projectWorkerId}/change-status`,
      statusData
    );
    return data.data;
  },

  // Cancel assignment
  cancelAssignment: async (projectWorkerId: number, reason?: string): Promise<ProjectWorker> => {
    const { data } = await apiClient.post<ApiResponse<ProjectWorker>>(
      `/project-workers/${projectWorkerId}/cancel`,
      { reason }
    );
    return data.data;
  },

  // Complete assignment
  completeAssignment: async (projectWorkerId: number): Promise<ProjectWorker> => {
    const { data } = await apiClient.post<ApiResponse<ProjectWorker>>(
      `/project-workers/${projectWorkerId}/complete`
    );
    return data.data;
  },

  // Remove worker from project
  removeWorker: async (projectWorkerId: number): Promise<void> => {
    await apiClient.delete(`/project-workers/${projectWorkerId}`);
  },

  // Check conflicts
  checkConflicts: async (projectWorkerId: number): Promise<ProjectWorkerConflict> => {
    const { data } = await apiClient.get<ApiResponse<ProjectWorkerConflict>>(
      `/project-workers/${projectWorkerId}/conflicts`
    );
    return data.data;
  },

  // Get effective rate
  getEffectiveRate: async (
    projectWorkerId: number
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
    >(`/project-workers/${projectWorkerId}/effective-rate`);
    return data.data;
  },

  // Get all project roles
  getRoles: async (): Promise<ProjectRole[]> => {
    const { data } = await apiClient.get<ApiResponse<ProjectRole[]>>('/project-roles');
    return data.data;
  },

  // Assign a worker to an existing slot
  assignSlot: async (projectWorkerId: number, data: {
    worker_id: number;
    assigned_from?: string;
    assigned_to?: string | null;
    notes?: string | null;
    actual_cost_rate?: number;
  }): Promise<ProjectWorker> => {
    const response = await apiClient.post<ApiResponse<ProjectWorker>>(
      `/project-workers/${projectWorkerId}/assign-slot`,
      data
    );
    return response.data.data;
  },

  // Get schedules for a worker slot
  getSchedules: async (projectWorkerId: number): Promise<ProjectWorkerSchedule[]> => {
    const response = await apiClient.get<ApiResponse<ProjectWorkerSchedule[]>>(
      `/project-workers/${projectWorkerId}/schedules`
    );
    return response.data.data;
  },

  // Create a schedule day
  createSchedule: async (projectWorkerId: number, data: {
    scheduled_date: string;
    planned_start_time?: string | null;
    planned_end_time?: string | null;
    planned_hours?: number | null;
    notes?: string | null;
  }): Promise<ProjectWorkerSchedule> => {
    const response = await apiClient.post<ApiResponse<ProjectWorkerSchedule>>(
      `/project-workers/${projectWorkerId}/schedules`,
      data
    );
    return response.data.data;
  },
};
