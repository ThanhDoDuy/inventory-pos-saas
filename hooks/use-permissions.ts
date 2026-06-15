import useSWR from 'swr';
import { apiGet, API_BASE_URL } from '@/lib/api-client';

const fetcher = (url: string) => apiGet(url.replace(API_BASE_URL, ''));

export interface PermissionItem {
  code: string;
  name?: string;
  module?: string;
}

export function usePermissions() {
  const { data, error, isLoading } = useSWR<PermissionItem[]>(
    `${API_BASE_URL}/rbac/permissions`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { permissions: data ?? [], isLoading, error };
}
