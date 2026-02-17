import { apiClient } from "./client";
import { PaymentTermData } from "@/lib/types";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

interface GetAllParams {
  page?: number;
  per_page?: number;
  is_active?: boolean;
  search?: string;
}

export const paymentTermsApi = {
  getAll: async (
    params?: GetAllParams,
  ): Promise<PaginatedResponse<PaymentTermData>> => {
    const response = await apiClient.get("/payment-terms", { params });
    return response.data;
  },

  getById: async (id: number): Promise<PaymentTermData> => {
    const response = await apiClient.get(`/payment-terms/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<PaymentTermData>): Promise<PaymentTermData> => {
    const response = await apiClient.post("/payment-terms", data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<PaymentTermData>,
  ): Promise<PaymentTermData> => {
    const response = await apiClient.put(`/payment-terms/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/payment-terms/${id}`);
  },
};
