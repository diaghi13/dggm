import apiClient from "./client";
import { ApiResponse, User } from "@/lib/types";

export interface UpdateProfileData {
  name: string;
  email: string;
}

export interface Session {
  id: number;
  name: string;
  token: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  is_current?: boolean;
}

export const profileApi = {
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await apiClient.put<ApiResponse<{ user: User }>>(
      "/auth/profile",
      data,
    );
    return response.data.data.user;
  },

  getSessions: async (): Promise<Session[]> => {
    try {
      const response =
        await apiClient.get<ApiResponse<Session[]>>("/auth/sessions");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }
  },

  revokeSession: async (tokenId: number): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${tokenId}`);
  },

  revokeOtherSessions: async (): Promise<void> => {
    await apiClient.post("/auth/sessions/revoke-others");
  },
};
