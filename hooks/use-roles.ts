import useSWR from 'swr';
import { apiDelete, apiGet, apiPatch, apiPost, API_BASE_URL } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';

const fetcher = (url: string) => apiGet(url.replace(API_BASE_URL, ''));

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_system?: boolean;
  is_wildcard?: boolean;
  permission_codes: string[];
}

export interface CreateRolePayload {
  code: string;
  name: string;
  description?: string;
  permission_codes: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permission_codes?: string[];
}

function mapRole(raw: Record<string, unknown>): RoleItem {
  const permissionCodes = Array.isArray(raw.permission_codes)
    ? raw.permission_codes.map(String)
    : [];

  return {
    id: stringifyId(raw._id ?? raw.id),
    code: String(raw.code ?? ''),
    name: String(raw.name ?? ''),
    description: raw.description ? String(raw.description) : undefined,
    is_system: Boolean(raw.is_system),
    is_wildcard: Boolean(raw.is_wildcard),
    permission_codes: permissionCodes,
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

export async function createRole(payload: CreateRolePayload) {
  const raw = await apiPost<Record<string, unknown>>('/rbac/roles', payload);
  return mapRole(raw);
}

export async function updateRole(id: string, payload: UpdateRolePayload) {
  const raw = await apiPatch<Record<string, unknown>>(`/rbac/roles/${id}`, payload);
  return mapRole(raw);
}

export async function deleteRole(id: string) {
  return apiDelete<{ message: string }>(`/rbac/roles/${id}`);
}
