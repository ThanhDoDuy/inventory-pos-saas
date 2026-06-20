import useSWR from 'swr';
import {
  apiGet,
  apiPatch,
  API_BASE_URL,
  extractErrorMessage,
  swrFetcher as fetcher,
} from '@/lib/api-client';
import { stringifyId } from '@/lib/format';
import { tMessage } from '@/lib/i18n/get-message';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';

export const NOTIFICATION_TYPES = ['LOW_STOCK', 'PO_RECEIVED', 'INVOICE_PAID'] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at?: string;
}

interface NotificationListResponse {
  items: Record<string, unknown>[];
  unread_count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

function mapNotification(raw: Record<string, unknown>): NotificationItem {
  return {
    id: stringifyId(raw._id ?? raw.id),
    type: String(raw.type ?? ''),
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    payload: (raw.payload as Record<string, unknown>) ?? {},
    is_read: Boolean(raw.is_read),
    read_at: raw.read_at ? String(raw.read_at) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  };
}

export function useNotifications(filters?: {
  unread?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams({
    limit: String(filters?.limit ?? DEFAULT_PAGE_SIZE),
    page: String(filters?.page ?? 1),
  });
  if (filters?.unread) params.set('unread', 'true');
  if (filters?.type && filters.type !== 'all') params.set('type', filters.type);

  const { data, error, isLoading, mutate } = useSWR<NotificationListResponse>(
    `${API_BASE_URL}/notifications?${params.toString()}`,
    fetcher,
  );

  return {
    notifications: (data?.items ?? []).map(mapNotification),
    unreadCount: data?.unread_count ?? 0,
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

export async function markNotificationRead(id: string) {
  try {
    return await apiPatch<Record<string, unknown>>(`/notifications/${id}/read`);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('notifications.error.markReadFailed')));
  }
}

export async function markAllNotificationsRead() {
  try {
    return await apiPatch<{ message: string; updated_count: number }>(
      '/notifications/read-all',
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('notifications.error.markAllFailed')));
  }
}
