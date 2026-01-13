import { apiClient } from './client';
import { Quote, QuoteFormData, PaginatedResponse } from '@/lib/types';

interface GetQuotesParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  customer_id?: number;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const quotesApi = {
  async getAll(params?: GetQuotesParams): Promise<PaginatedResponse<Quote>> {
    const response = await apiClient.get('/quotes', { params });
    return response.data;
  },

  async getById(id: number): Promise<Quote> {
    const response = await apiClient.get(`/quotes/${id}`);
    return response.data.data;
  },

  async create(data: QuoteFormData): Promise<Quote> {
    const response = await apiClient.post('/quotes', data);
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

  async downloadPdf(id: number): Promise<Blob> {
    const response = await apiClient.get(`/quotes/${id}/pdf/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async previewPdf(id: number): Promise<Blob> {
    const response = await apiClient.get(`/quotes/${id}/pdf/preview`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Media Library (Spatie)
  async uploadMedia(quoteId: number, formData: FormData): Promise<any> {
    const response = await apiClient.post(`/media/quotes/${quoteId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async downloadMedia(mediaId: number): Promise<Blob> {
    const response = await apiClient.get(`/media/${mediaId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async deleteMedia(mediaId: number): Promise<void> {
    await apiClient.delete(`/media/${mediaId}`);
  },
};
