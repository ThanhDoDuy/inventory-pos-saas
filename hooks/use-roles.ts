import useSWR from 'swr';
import { apiGet, API_BASE_URL } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';

const fetcher = (url: string) => apiGet(url.replace(API_BASE_URL, ''));

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  is_system?: boolean;
}

function mapRole(raw: Record<string, unknown>): RoleItem {
  return {
    id: stringifyId(raw._id ?? raw.id),
    code: String(raw.code ?? ''),
    name: String(raw.name ?? ''),
    is_system: Boolean(raw.is_system),
  };
}

export function useRoles() {
  const { data, error, isLoading, mutate } = useSWR<Record<string, unknown>[]>(
    `${API_BASE_URL}/rbac/roles`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const roles = Array.isArray(data) ? data.map((item) => mapRole(item)) : [];

  return { roles, isLoading, error, mutate };
}
