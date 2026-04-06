import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export interface CreateEmailAccountData {
  name: string;
  provider: string;
  from_email: string;
  from_name: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_encryption?: string | null;
  smtp_username?: string;
  smtp_password?: string;
  is_active?: boolean;
  is_default?: boolean;
  signature?: string | null;
  signature_plain?: string | null;
}

export type UpdateEmailAccountData = Partial<CreateEmailAccountData>;

export const emailAccountsApi = {
  getAll: async (): Promise<App.Data.EmailAccountData[]> => {
    const response = await apiClient.get<ApiResponse<App.Data.EmailAccountData[]>>(
      "/email-accounts",
    );
    return response.data.data ?? (response.data as unknown as App.Data.EmailAccountData[]);
  },

  getById: async (id: number): Promise<App.Data.EmailAccountData> => {
    const response = await apiClient.get<ApiResponse<App.Data.EmailAccountData>>(
      `/email-accounts/${id}`,
    );
    return response.data.data ?? (response.data as unknown as App.Data.EmailAccountData);
  },

  create: async (data: CreateEmailAccountData): Promise<App.Data.EmailAccountData> => {
    const response = await apiClient.post<ApiResponse<App.Data.EmailAccountData>>(
      "/email-accounts",
      data,
    );
    return response.data.data ?? (response.data as unknown as App.Data.EmailAccountData);
  },

  update: async (
    id: number,
    data: UpdateEmailAccountData,
  ): Promise<App.Data.EmailAccountData> => {
    const response = await apiClient.put<ApiResponse<App.Data.EmailAccountData>>(
      `/email-accounts/${id}`,
      data,
    );
    return response.data.data ?? (response.data as unknown as App.Data.EmailAccountData);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/email-accounts/${id}`);
  },

  test: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>(`/email-accounts/${id}/test`);
    return response.data;
  },

  setDefault: async (id: number): Promise<App.Data.EmailAccountData> => {
    const response = await apiClient.post<ApiResponse<App.Data.EmailAccountData>>(
      `/email-accounts/${id}/set-default`,
    );
    return response.data.data ?? (response.data as unknown as App.Data.EmailAccountData);
  },
};

export const emailLogsApi = {
  getAll: async (params?: {
    document_type?: string;
    document_id?: number;
    status?: string;
    page?: number;
  }): Promise<{ data: App.Data.EmailLogData[]; meta: { total: number; current_page: number } }> => {
    const response = await apiClient.get("/email-logs", { params });
    return response.data as {
      data: App.Data.EmailLogData[];
      meta: { total: number; current_page: number };
    };
  },
};
