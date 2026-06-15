import useSWR from 'swr';
import { apiGet, API_BASE_URL } from '@/lib/api-client';

const fetcher = (url: string) => apiGet(url.replace(API_BASE_URL, ''));

export interface PermissionItem {
  code: string;
  name?: string;
  module?: string;
  action?: string;
  description?: string;
}

function mapPermission(raw: Record<string, unknown>): PermissionItem {
  return {
    code: String(raw.code ?? ''),
    module: raw.module ? String(raw.module) : undefined,
    action: raw.action ? String(raw.action) : undefined,
    description: raw.description ? String(raw.description) : undefined,
  };
}

export function usePermissions() {
  const { data, error, isLoading } = useSWR<Record<string, unknown>[]>(
    `${API_BASE_URL}/rbac/permissions`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const permissions = Array.isArray(data) ? data.map((item) => mapPermission(item)) : [];

  return { permissions, isLoading, error };
}
