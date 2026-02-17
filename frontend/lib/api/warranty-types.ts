import { apiClient } from "./client";
import { WarrantyTypeData } from "@/lib/types";

interface Response<T> {
  data: T[];
}

interface GetAllParams {
  is_active?: boolean;
  search?: string;
}

export const warrantyTypesApi = {
  getAll: async (
    params?: GetAllParams,
  ): Promise<Response<WarrantyTypeData>> => {
    const response = await apiClient.get("/warranty-types", { params });
    return response.data;
  },

  getDefault: async (): Promise<WarrantyTypeData> => {
    const response = await apiClient.get("/warranty-types/default");
    return response.data.data;
  },

  getById: async (id: number): Promise<WarrantyTypeData> => {
    const response = await apiClient.get(`/warranty-types/${id}`);
    return response.data.data;
  },

  create: async (
    data: Partial<WarrantyTypeData>,
  ): Promise<WarrantyTypeData> => {
    const response = await apiClient.post("/warranty-types", data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<WarrantyTypeData>,
  ): Promise<WarrantyTypeData> => {
    const response = await apiClient.put(`/warranty-types/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/warranty-types/${id}`);
  },
};
