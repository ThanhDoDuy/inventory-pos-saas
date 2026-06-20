import useSWR from 'swr';
import {
  apiGet,
  apiPatch,
  apiPost,
  API_BASE_URL,
  extractErrorMessage,
  swrFetcher as fetcher,
} from '@/lib/api-client';
import { stringifyId } from '@/lib/format';
import { tMessage } from '@/lib/i18n/get-message';
import { DEFAULT_PAGE_SIZE, paginationFromListResponse } from '@/lib/pagination';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role?: { id: string; code: string; name: string };
  status: string;
  last_login_at?: string;
  is_owner?: boolean;
}

interface UsersListResponse {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

function mapUser(raw: Record<string, unknown>): UserProfile {
  const role = raw.role as Record<string, unknown> | undefined;
  return {
    id: stringifyId(raw.id ?? raw._id),
    username: String(raw.username ?? ''),
    email: String(raw.email ?? ''),
    status: String(raw.status ?? ''),
    last_login_at: raw.last_login_at ? String(raw.last_login_at) : undefined,
    role: role
      ? {
          id: stringifyId(role.id ?? role._id),
          code: String(role.code ?? ''),
          name: String(role.name ?? ''),
        }
      : undefined,
    is_owner: Boolean(raw.is_owner),
  };
}

export function useUsers(search?: string, roleId?: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });
  if (search) params.set('search', search);
  if (roleId) params.set('role_id', roleId);

  const { data, error, isLoading, mutate } = useSWR<UsersListResponse>(
    `${API_BASE_URL}/users?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const users = (data?.items ?? []).map(mapUser);

  return {
    users,
    total: data?.total ?? 0,
    pagination: paginationFromListResponse(data),
    isLoading,
    error,
    mutate,
  };
}

export function useUser(userId: string) {
  const { data, error, isLoading, mutate } = useSWR<Record<string, unknown>>(
    userId ? `${API_BASE_URL}/users/${userId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { user: data ? mapUser(data) : undefined, isLoading, error, mutate };
}

export async function createUser(userData: Record<string, unknown>) {
  try {
    return await apiPost('/users', userData);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('users.error.createFailed')));
  }
}

export async function updateUser(userId: string, userData: Record<string, unknown>) {
  try {
    return await apiPatch(`/users/${userId}`, userData);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('users.error.updateFailed')));
  }
}

export async function disableUser(userId: string, reason = 'Disabled by admin') {
  try {
    return await apiPatch(`/users/${userId}/disable`, { reason });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('users.error.disableFailed')));
  }
}

export async function assignUserRole(userId: string, roleId: string) {
  try {
    return await apiPatch(`/users/${userId}/assign-role`, { role_id: roleId });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('users.error.assignRoleFailed')));
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    return await apiPost(`/users/${userId}/reset-password`, { new_password: newPassword });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('users.error.resetPasswordFailed')));
  }
}

export async function activateUser(userId: string) {
  try {
    return await apiPatch(`/users/${userId}/activate`, {});
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('users.error.activateFailed')));
  }
}
