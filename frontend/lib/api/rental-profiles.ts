import { apiClient } from "./client";
import type { ApiResponse, RentalProfile } from "@/lib/types";

export const rentalProfilesApi = {
  getAll: async (): Promise<RentalProfile[]> => {
    const response = await apiClient.get<ApiResponse<RentalProfile[]>>(
      "/rental-profiles",
    );
    return response.data.data;
  },

  getById: async (id: number): Promise<RentalProfile> => {
    const response = await apiClient.get<ApiResponse<RentalProfile>>(
      `/rental-profiles/${id}`,
    );
    return response.data.data;
  },

  create: async (data: Partial<RentalProfile>): Promise<RentalProfile> => {
    const response = await apiClient.post<ApiResponse<RentalProfile>>(
      "/rental-profiles",
      data,
    );
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<RentalProfile>,
  ): Promise<RentalProfile> => {
    const response = await apiClient.put<ApiResponse<RentalProfile>>(
      `/rental-profiles/${id}`,
      data,
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/rental-profiles/${id}`);
  },

  recalculate: async (id: number): Promise<void> => {
    await apiClient.post(`/rental-profiles/${id}/recalculate`);
  },
};
