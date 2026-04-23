import { apiClient } from "./client";
import {
  Quote,
  QuoteFormData,
  QuoteItem,
  PaginatedResponse,
} from "@/lib/types";

interface GetQuotesParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  customer_id?: number;
  project_manager_id?: number;
  is_active?: boolean;
  from_date?: string;
  to_date?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const quotesApi = {
  async getAll(params?: GetQuotesParams): Promise<PaginatedResponse<Quote>> {
    const response = await apiClient.get("/quotes", { params });
    return response.data;
  },

  async getById(id: number): Promise<Quote> {
    const response = await apiClient.get(`/quotes/${id}`, {
      params: {
        with: "items,customer,projectManager,priceList,paymentTerm,financialResource,warrantyType,site",
      },
    });
    return response.data.data;
  },

  async create(data: QuoteFormData): Promise<Quote> {
    const response = await apiClient.post("/quotes", data);
    return response.data.data;
  },

  async update(id: number, data: Partial<QuoteFormData>): Promise<Quote> {
    const response = await apiClient.put(`/quotes/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/quotes/${id}`);
  },

  async changeStatus(id: number, status: string): Promise<Quote> {
    const response = await apiClient.patch(`/quotes/${id}/status`, { status });
    return response.data.data;
  },

  async approve(id: number): Promise<Quote> {
    const response = await apiClient.post(`/quotes/${id}/approve`);
    return response.data.data;
  },

  async reject(id: number): Promise<Quote> {
    const response = await apiClient.post(`/quotes/${id}/reject`);
    return response.data.data;
  },

  async send(id: number): Promise<{ quote: Quote; warning: string | null }> {
    const response = await apiClient.post(`/quotes/${id}/send`);
    return { quote: response.data.data, warning: response.data.warning ?? null };
  },

  async markAsSent(id: number): Promise<{ quote: Quote }> {
    const response = await apiClient.post(`/quotes/${id}/mark-as-sent`);
    return { quote: response.data.data };
  },

  async convertToProject(
    id: number,
  ): Promise<{ quote: Quote; project_id: number }> {
    const response = await apiClient.post(`/quotes/${id}/convert-to-project`);
    return response.data.data;
  },

  async savePdf(id: number): Promise<{ pdf_url: string; file_name: string }> {
    const response = await apiClient.post(`/quotes/${id}/save-pdf`);
    return response.data.data;
  },

  async downloadPdf(id: number): Promise<Blob> {
    const response = await apiClient.get(`/quotes/${id}/pdf/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  async previewPdf(id: number): Promise<Blob> {
    const response = await apiClient.get(`/quotes/${id}/pdf/preview`, {
      responseType: "blob",
    });
    return response.data;
  },

  async refreshTerms(id: number): Promise<{ terms_and_conditions: string }> {
    const response = await apiClient.post(`/quotes/${id}/refresh-terms`);
    return response.data.data;
  },

  async duplicate(id: number): Promise<Quote> {
    const response = await apiClient.post(`/quotes/${id}/duplicate`);
    return response.data.data;
  },

  // Media Library (Spatie)
  async uploadMedia(quoteId: number, formData: FormData): Promise<any> {
    const response = await apiClient.post(
      `/media/quotes/${quoteId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  },

  async downloadMedia(mediaId: number): Promise<Blob> {
    const response = await apiClient.get(`/media/${mediaId}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  async deleteMedia(mediaId: number): Promise<void> {
    await apiClient.delete(`/media/${mediaId}`);
  },
};
