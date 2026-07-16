import { api } from '../lib/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  actionUrl?: string;
  createdAt: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  return await api.get('/notifications');
};

export const markAsRead = async (id: string): Promise<Notification> => {
  return await api.patch(`/notifications/${id}/read`);
};
