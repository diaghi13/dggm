import apiClient from './client';
import { ApiResponse, Notification, NotificationMeta } from '@/lib/types';

export interface NotificationsParams {
  per_page?: number;
  unread_only?: boolean;
  page?: number;
}

export const notificationsApi = {
  // Get all notifications
  getAll: async (params?: NotificationsParams): Promise<{ data: Notification[]; meta: NotificationMeta }> => {
    const { data } = await apiClient.get<any>('/notifications', { params });
    return {
      data: data.data,
      meta: data.meta,
    };
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return data.data.count;
  },

  // Mark as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.post(`/notifications/${notificationId}/mark-read`);
  },

  // Mark all as read
  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark-all-read');
  },

  // Delete notification
  delete: async (notificationId: string): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  // Delete all read
  deleteAllRead: async (): Promise<void> => {
    await apiClient.delete('/notifications/read/all');
  },
};
