import useSWR from 'swr';
import { apiGet, API_BASE_URL, swrFetcher as fetcher } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';

export const AUDIT_MODULES = [
  'AUTH',
  'SETTINGS',
  'INVENTORY',
  'INVOICE',
  'PO',
  'PRODUCT',
  'USER',
  'RBAC',
  'REPORT',
  'SECURITY',
] as const;

export const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PERMISSION_DENIED',
  'PASSWORD_CHANGED',
  'TOKEN_REFRESHED',
  'UPDATE_SETTING',
  'RESET_SETTING',
  'TOGGLE_FEATURE_FLAG',
  'CREATE_INVOICE',
  'RECEIVE_PO',
  'STOCK_ADJUSTMENT',
  'VIEW_REPORT',
  'EXPORT_REPORT',
  'EXPORT_AUDIT',
] as const;

export interface AuditLogItem {
  id: string;
  user_id?: string;
  action: string;
  module: string;
  entity_id?: string;
  status: string;
  ip_address?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

interface AuditListResponse {
  items: Record<string, unknown>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

function mapAuditLog(raw: Record<string, unknown>): AuditLogItem {
  return {
    id: stringifyId(raw._id ?? raw.id),
    user_id: raw.user_id ? stringifyId(raw.user_id) : undefined,
    action: String(raw.action ?? ''),
    module: String(raw.module ?? ''),
    entity_id: raw.entity_id ? String(raw.entity_id) : undefined,
    status: String(raw.status ?? ''),
    ip_address: raw.ip_address ? String(raw.ip_address) : undefined,
    old_value: (raw.old_value as Record<string, unknown>) ?? undefined,
    new_value: (raw.new_value as Record<string, unknown>) ?? undefined,
    metadata: (raw.metadata as Record<string, unknown>) ?? undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  };
}

export function useAuditLogs(filters?: {
  module?: string;
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams({ limit: String(filters?.limit ?? 50) });
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.module && filters.module !== 'all') params.set('module', filters.module);
  if (filters?.action && filters.action !== 'all') params.set('action', filters.action);
  if (filters?.userId) params.set('userId', filters.userId);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);

  const { data, error, isLoading, mutate } = useSWR<AuditListResponse>(
    `${API_BASE_URL}/audit-logs?${params.toString()}`,
    fetcher,
  );

  return {
    logs: (data?.items ?? []).map(mapAuditLog),
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

export async function getAuditLog(id: string): Promise<AuditLogItem> {
  const raw = await apiGet<Record<string, unknown>>(`/audit-logs/${id}`);
  return mapAuditLog(raw);
}
