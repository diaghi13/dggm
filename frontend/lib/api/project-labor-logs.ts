import type { ProjectLaborLog } from "@/lib/types";
import type { ApiResponse, PaginatedResponse } from "@/lib/types";
import apiClient from "@/lib/api/client";

export interface LaborLogsParams {
  project_worker_id?: number;
  status?: string;
  page?: number;
  per_page?: number;
}

export const projectLaborLogsApi = {
  getByProject: async (
    projectId: number,
    params?: LaborLogsParams,
  ): Promise<PaginatedResponse<ProjectLaborLog>> => {
    const response = await apiClient.get<PaginatedResponse<ProjectLaborLog>>(
      `/projects/${projectId}/labor-logs`,
      { params },
    );
    return response.data;
  },

  submit: async (
    projectWorkerId: number,
    data: {
      log_date: string;
      clock_in?: string;
      clock_out?: string;
      regular_hours?: number;
      overtime_hours?: number;
      description?: string | null;
      schedule_day_id?: number | null;
      overtime_cause?: string | null;
      is_billable_to_client?: boolean;
      overtime_rate_multiplier?: number | null;
      include_in_final_balance?: boolean;
      break_minutes?: number;
      overtime_rate_type?: string | null;
      overtime_direct_rate?: number | null;
    },
  ): Promise<ProjectLaborLog> => {
    const response = await apiClient.post<ApiResponse<ProjectLaborLog>>(
      `/project-workers/${projectWorkerId}/labor-logs`,
      data,
    );
    return response.data.data;
  },

  getById: async (id: number): Promise<ProjectLaborLog> => {
    const response = await apiClient.get<ApiResponse<ProjectLaborLog>>(
      `/project-labor-logs/${id}`,
    );
    return response.data.data;
  },

  approve: async (id: number): Promise<ProjectLaborLog> => {
    const response = await apiClient.post<ApiResponse<ProjectLaborLog>>(
      `/project-labor-logs/${id}/approve`,
    );
    return response.data.data;
  },

  reject: async (id: number, reason: string): Promise<ProjectLaborLog> => {
    const response = await apiClient.post<ApiResponse<ProjectLaborLog>>(
      `/project-labor-logs/${id}/reject`,
      { rejection_reason: reason },
    );
    return response.data.data;
  },

  update: async (
    id: number,
    data: {
      log_date: string;
      clock_in?: string;
      clock_out?: string;
      break_minutes?: number;
      description?: string | null;
      overtime_cause?: string | null;
      is_billable_to_client?: boolean;
      overtime_rate_multiplier?: number | null;
      include_in_final_balance?: boolean;
      overtime_rate_type?: string | null;
      overtime_direct_rate?: number | null;
    },
  ): Promise<ProjectLaborLog> => {
    const response = await apiClient.put<ApiResponse<ProjectLaborLog>>(
      `/project-labor-logs/${id}`,
      data,
    );
    return response.data.data;
  },

  changeStatus: async (
    id: number,
    status: string,
    rejectionReason?: string,
  ): Promise<ProjectLaborLog> => {
    const response = await apiClient.post<ApiResponse<ProjectLaborLog>>(
      `/project-labor-logs/${id}/change-status`,
      { status, rejection_reason: rejectionReason ?? null },
    );
    return response.data.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/project-labor-logs/${id}`);
  },
};
