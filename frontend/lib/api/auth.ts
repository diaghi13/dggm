import apiClient from "./client";
import {
  AuthResponse,
  LoginCredentials,
  User,
  ApiResponse,
  AuthMeResponse,
  UserSettings,
  TenantInfo,
} from "@/lib/types";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials,
    );
    return data;
  },

  getTenants: async (): Promise<TenantInfo[]> => {
    const { data } = await apiClient.get<ApiResponse<TenantInfo[]>>("/auth/tenants");
    return data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  me: async (): Promise<AuthMeResponse> => {
    const { data } =
      await apiClient.get<ApiResponse<AuthMeResponse>>("/auth/me");
    return data.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/forgot-password",
      { email },
    );
    return data.data || { message: data.message || "Email sent successfully" };
  },

  resetPassword: async (payload: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/reset-password",
      payload,
    );
    return (
      data.data || { message: data.message || "Password reset successfully" }
    );
  },

  changePassword: async (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/change-password",
      payload,
    );
    return (
      data.data || { message: data.message || "Password changed successfully" }
    );
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    company_name: string;
    plan_id: number;
    billing_cycle?: "monthly" | "yearly";
    addons?: string[];
  }): Promise<AuthResponse> => {
    const { data: response } = await apiClient.post<AuthResponse>("/auth/register", data);
    return response;
  },

  getPublicPlans: async (): Promise<{ id: number; name: string; slug: string; description: string | null; price: number | null; price_yearly: number | null; features: { feature_key: string; price: number | null; price_yearly: number | null }[] }[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: { id: number; name: string; slug: string; description: string | null; price: number | null; price_yearly: number | null; features: { feature_key: string; price: number | null; price_yearly: number | null }[] }[] }>("/plans");
    return data.data;
  },

  getTenantStatus: async (
    tenantId: string,
  ): Promise<{ status: string; tenant_name?: string }> => {
    const { data } = await apiClient.get<
      ApiResponse<{ status: string; tenant_name?: string }>
    >(`/auth/tenant-status/${tenantId}`);
    return data.data;
  },

  switchTenant: async (
    tenantId: string,
    globalToken: string,
  ): Promise<{
    user: User;
    settings: UserSettings;
    features: string[];
  }> => {
    // Must send global_token as Authorization Bearer (NOT the cookie token)
    // and x-tenant header for the TARGET tenant.
    // The server responds with a new auth_token cookie for the target tenant.
    const { data } = await apiClient.post<
      ApiResponse<{ user: User; settings: UserSettings; features: string[] }>
    >(
      "/auth/switch-tenant",
      { tenant_id: tenantId },
      {
        headers: {
          Authorization: `Bearer ${globalToken}`,
          "x-tenant": tenantId,
        },
      },
    );
    return data.data;
  },
};
