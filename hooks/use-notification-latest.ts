import useSWR from 'swr';
import {
  apiGet,
  API_BASE_URL,
  swrFetcher as fetcher,
} from '@/lib/api-client';
import { stringifyId } from '@/lib/format';
import {
  NOTIFICATION_LATEST_LIMIT,
  NOTIFICATION_POLL_INTERVAL_MS,
} from '@/lib/notification-config';
import type { NotificationItem } from '@/hooks/use-notifications';

export interface NotificationLatestResponse {
  items: Record<string, unknown>[];
  unread_count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

export function mapNotificationItem(raw: Record<string, unknown>): NotificationItem {
  return {
    id: stringifyId(raw._id ?? raw.id),
    type: String(raw.type ?? ''),
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    payload: (raw.payload as Record<string, unknown>) ?? {},
    redirect_url: raw.redirect_url ? String(raw.redirect_url) : undefined,
    is_read: Boolean(raw.is_read),
    read_at: raw.read_at ? String(raw.read_at) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  };
}

function mapLatestResponse(data: NotificationLatestResponse) {
  return {
    items: (data.items ?? []).map(mapNotificationItem),
    unreadCount: data.unread_count ?? 0,
    pagination: data.pagination ?? {
      page: 1,
      limit: NOTIFICATION_LATEST_LIMIT,
      total: 0,
      total_pages: 0,
      has_more: false,
    },
  };
}

export function useNotificationLatest(enabled: boolean) {
  const { data, error, isLoading, mutate, isValidating } =
    useSWR<NotificationLatestResponse>(
      enabled
        ? `${API_BASE_URL}/notifications/latest?page=1&limit=${NOTIFICATION_LATEST_LIMIT}`
        : null,
      fetcher,
      {
        refreshInterval: NOTIFICATION_POLL_INTERVAL_MS,
        refreshWhenHidden: false,
        revalidateOnFocus: true,
        dedupingInterval: 5_000,
      },
    );

  const mapped = data ? mapLatestResponse(data) : null;

  return {
    items: mapped?.items ?? [],
    unreadCount: mapped?.unreadCount ?? 0,
    pagination: mapped?.pagination,
    isLoading: enabled && isLoading,
    isValidating,
    error,
    mutate,
  };
}

export async function fetchNotificationLatestPage(page: number) {
  const raw = await apiGet<NotificationLatestResponse>(
    `/notifications/latest?page=${page}&limit=${NOTIFICATION_LATEST_LIMIT}`,
  );
  return mapLatestResponse(raw);
}
