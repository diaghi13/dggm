import apiClient from './client';
import {
  ApiResponse,
  MaterialRequest,
  MaterialRequestFormData,
  MaterialRequestStats,
  MaterialRequestStatus,
  MaterialRequestPriority,
  UpdateMaterialRequestData,
  RespondToMaterialRequestData,
} from '@/lib/types';

export interface MaterialRequestsParams {
  status?: MaterialRequestStatus;
  priority?: MaterialRequestPriority;
  worker_id?: number;
  site_id?: number;
}

export const materialRequestsApi = {
  // Get material requests for a site
  getRequestsBySite: async (
    siteId: number,
    params?: MaterialRequestsParams
  ): Promise<MaterialRequest[]> => {
    const { data } = await apiClient.get<ApiResponse<MaterialRequest[]>>(
      `/sites/${siteId}/material-requests`,
      { params }
    );
    return data.data;
  },

  // Get pending requests count for a site
  getPendingCount: async (siteId: number): Promise<number> => {
    const { data } = await apiClient.get<ApiResponse<{ count: number }>>(
      `/sites/${siteId}/material-requests/pending-count`
    );
    return data.data.count;
  },

  // Get statistics for a site
  getStats: async (siteId: number): Promise<MaterialRequestStats> => {
    const { data } = await apiClient.get<ApiResponse<MaterialRequestStats>>(
      `/sites/${siteId}/material-requests/stats`
    );
    return data.data;
  },

  // Get my material requests (worker)
  getMyRequests: async (params?: MaterialRequestsParams): Promise<MaterialRequest[]> => {
    const { data } = await apiClient.get<ApiResponse<MaterialRequest[]>>(
      '/my-material-requests',
      { params }
    );
    return data.data;
  },

  // Create a new material request
  create: async (requestData: MaterialRequestFormData): Promise<MaterialRequest> => {
    const { data } = await apiClient.post<ApiResponse<MaterialRequest>>(
      '/material-requests',
      requestData
    );
    return data.data;
  },

  // Get a single material request
  getById: async (requestId: number): Promise<MaterialRequest> => {
    const { data } = await apiClient.get<ApiResponse<MaterialRequest>>(
      `/material-requests/${requestId}`
    );
    return data.data;
  },

  // Update a material request (only if pending)
  update: async (
    requestId: number,
    updateData: UpdateMaterialRequestData
  ): Promise<MaterialRequest> => {
    const { data } = await apiClient.patch<ApiResponse<MaterialRequest>>(
      `/material-requests/${requestId}`,
      updateData
    );
    return data.data;
  },

  // Approve a material request
  approve: async (
    requestId: number,
    responseData?: RespondToMaterialRequestData
  ): Promise<MaterialRequest> => {
    const { data } = await apiClient.post<ApiResponse<MaterialRequest>>(
      `/material-requests/${requestId}/approve`,
      responseData || {}
    );
    return data.data;
  },

  // Reject a material request
  reject: async (
    requestId: number,
    rejectionReason?: string
  ): Promise<MaterialRequest> => {
    const { data } = await apiClient.post<ApiResponse<MaterialRequest>>(
      `/material-requests/${requestId}/reject`,
      { rejection_reason: rejectionReason }
    );
    return data.data;
  },

  // Mark as delivered
  markDelivered: async (
    requestId: number,
    quantityDelivered?: number
  ): Promise<MaterialRequest> => {
    const { data } = await apiClient.post<ApiResponse<MaterialRequest>>(
      `/material-requests/${requestId}/mark-delivered`,
      { quantity_delivered: quantityDelivered }
    );
    return data.data;
  },

  // Delete a material request
  delete: async (requestId: number): Promise<void> => {
    await apiClient.delete(`/material-requests/${requestId}`);
  },
};
