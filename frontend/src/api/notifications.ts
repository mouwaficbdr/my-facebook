import { API_BASE } from './base';

export interface Notification {
  id: number;
  type: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
  };
}

export async function fetchNotifications(
  page = 1,
  limit = 10,
  unreadOnly = false
): Promise<NotificationsResponse> {
  const url =
    `${API_BASE}/api/notifications.php?page=${page}&limit=${limit}` +
    (unreadOnly ? `&unread=1` : '');
  const res = await fetch(url, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || 'Erreur lors du chargement des notifications'
    );
  }
  return data.data;
}

export async function markNotificationsAsRead(ids: number[]): Promise<number> {
  const res = await fetch(`${API_BASE}/api/notifications/read.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ids }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || 'Erreur lors de la mise à jour des notifications'
    );
  }
  return data.updated;
}
