import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { API_BASE_URL, swrFetcher as fetcher } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import {
  hasAllPermissions,
  roleGrantsPermission,
  type RolePermissionSource,
} from '@/lib/rbac-utils';

export interface UserPermissionsResponse {
  is_wildcard: boolean;
  permission_codes: string[];
}

const EMPTY_SOURCE: RolePermissionSource = {
  is_wildcard: false,
  permission_codes: [],
};

export function useUserPermissions() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data, error, isLoading, mutate } = useSWR<UserPermissionsResponse>(
    isAuthenticated ? `${API_BASE_URL}/auth/permissions` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const permissionSource = useMemo<RolePermissionSource>(() => {
    if (!data) return EMPTY_SOURCE;
    return {
      is_wildcard: Boolean(data.is_wildcard),
      permission_codes: Array.isArray(data.permission_codes)
        ? data.permission_codes.map(String)
        : [],
    };
  }, [data]);

  const hasPermission = useCallback(
    (permissionCode: string) => roleGrantsPermission(permissionSource, permissionCode),
    [permissionSource],
  );

  const hasAll = useCallback(
    (permissionCodes: string[]) => hasAllPermissions(permissionSource, permissionCodes),
    [permissionSource],
  );

  return {
    permissionSource,
    isLoading: isAuthenticated && isLoading,
    error,
    hasPermission,
    hasAllPermissions: hasAll,
    mutate,
  };
}
