import apiClient from "./client";
import {
  AuthResponse,
  LoginCredentials,
  User,
  ApiResponse,
  AuthMeResponse,
} from "@/lib/types";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials,
    );
    return data;
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
    return data.data || { message: data.message || "Password reset successfully" };
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
    return data.data || { message: data.message || "Password changed successfully" };
  },
};
