import type { ProjectExpense } from '@/lib/types';
import type { ApiResponse, PaginatedResponse } from '@/lib/types';
import apiClient from '@/lib/api/client';

export interface ProjectExpensesParams {
  status?: string;
  category?: string;
  page?: number;
  per_page?: number;
}

export const projectExpensesApi = {
  getByProject: async (projectId: number, params?: ProjectExpensesParams): Promise<PaginatedResponse<ProjectExpense>> => {
    const response = await apiClient.get<PaginatedResponse<ProjectExpense>>(
      `/projects/${projectId}/expenses`,
      { params }
    );
    return response.data;
  },

  getSummary: async (projectId: number): Promise<{ total_actual: number; total_budgeted: number }> => {
    const response = await apiClient.get<ApiResponse<{ total_actual: number; total_budgeted: number }>>(
      `/projects/${projectId}/expenses/summary`
    );
    return response.data.data;
  },

  create: async (projectId: number, data: {
    project_worker_id?: number | null;
    category: string;
    description: string;
    amount: number;
    expense_date: string;
    is_billable_to_client?: boolean;
    receipt_media_id?: number | null;
    notes?: string | null;
    is_budgeted?: boolean;
    budgeted_amount?: number | null;
    billable_to_final_balance?: boolean;
  }): Promise<ProjectExpense> => {
    const response = await apiClient.post<ApiResponse<ProjectExpense>>(
      `/projects/${projectId}/expenses`,
      data
    );
    return response.data.data;
  },

  getById: async (id: number): Promise<ProjectExpense> => {
    const response = await apiClient.get<ApiResponse<ProjectExpense>>(
      `/project-expenses/${id}`
    );
    return response.data.data;
  },

  update: async (id: number, data: Partial<{
    category: string;
    description: string;
    amount: number;
    expense_date: string;
    is_billable_to_client: boolean;
    notes: string | null;
  }>): Promise<ProjectExpense> => {
    const response = await apiClient.put<ApiResponse<ProjectExpense>>(
      `/project-expenses/${id}`,
      data
    );
    return response.data.data;
  },

  approve: async (id: number): Promise<ProjectExpense> => {
    const response = await apiClient.post<ApiResponse<ProjectExpense>>(
      `/project-expenses/${id}/approve`
    );
    return response.data.data;
  },

  reject: async (id: number, reason: string): Promise<ProjectExpense> => {
    const response = await apiClient.post<ApiResponse<ProjectExpense>>(
      `/project-expenses/${id}/reject`,
      { rejection_reason: reason }
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/project-expenses/${id}`);
  },

  uploadReceipt: async (expenseId: number, file: File): Promise<{ media_id: number; receipt_url: string; file_name: string }> => {
    const formData = new FormData();
    formData.append('receipt', file);
    const response = await apiClient.post(
      `/project-expenses/${expenseId}/receipt`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.data;
  },

  deleteReceipt: async (expenseId: number): Promise<void> => {
    await apiClient.delete(`/project-expenses/${expenseId}/receipt`);
  },
};
