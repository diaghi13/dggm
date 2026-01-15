import apiClient from './client';
import {
  ApiResponse,
  WorkerInvitation,
  WorkerInvitationFormData,
  AcceptInvitationData,
  User,
  Worker,
} from '@/lib/types';

export interface InvitationsParams {
  status?: 'pending' | 'expired' | 'accepted';
  email?: string;
  supplier_id?: number;
}

export const invitationsApi = {
  // Get all invitations (PM/Admin)
  getAll: async (params?: InvitationsParams): Promise<WorkerInvitation[]> => {
    const { data } = await apiClient.get<ApiResponse<WorkerInvitation[]>>('/invitations', {
      params,
    });
    return data.data;
  },

  // Get pending invitations only
  getPending: async (): Promise<WorkerInvitation[]> => {
    const { data } = await apiClient.get<ApiResponse<WorkerInvitation[]>>('/invitations/pending');
    return data.data;
  },

  // Create and send invitation
  create: async (invitationData: WorkerInvitationFormData): Promise<WorkerInvitation> => {
    const { data } = await apiClient.post<ApiResponse<WorkerInvitation>>(
      '/invitations',
      invitationData
    );
    return data.data;
  },

  // Resend invitation
  resend: async (invitationId: number): Promise<WorkerInvitation> => {
    const { data } = await apiClient.post<ApiResponse<WorkerInvitation>>(
      `/invitations/${invitationId}/resend`
    );
    return data.data;
  },

  // Cancel invitation
  cancel: async (invitationId: number): Promise<void> => {
    await apiClient.delete(`/invitations/${invitationId}`);
  },

  // Get invitation by token (public - no auth)
  getByToken: async (token: string): Promise<WorkerInvitation> => {
    const { data } = await apiClient.get<ApiResponse<{ invitation: WorkerInvitation }>>(
      `/invitations/${token}`
    );
    return data.data.invitation;
  },

  // Accept invitation and create account (public - no auth)
  accept: async (
    token: string,
    acceptData: AcceptInvitationData
  ): Promise<{
    user: User;
    worker: Worker;
    token: string;
  }> => {
    const { data } = await apiClient.post<
      ApiResponse<{
        user: User;
        worker: Worker;
        token: string;
      }>
    >(`/invitations/${token}/accept`, acceptData);
    return data.data;
  },
};
