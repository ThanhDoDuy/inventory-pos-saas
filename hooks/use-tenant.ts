import { useMemo } from 'react';
import useSWR from 'swr';
import {
  apiGet,
  apiPatch,
  apiPost,
  API_BASE_URL,
  extractErrorMessage,
  swrFetcher as fetcher,
} from '@/lib/api-client';
import { tMessage } from '@/lib/i18n/get-message';

export interface TenantProfile {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  max_users?: number;
  address: string;
  phone: string;
  city: string;
  state: string;
}

function mapTenant(raw: Record<string, unknown>): TenantProfile {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: String(raw.name ?? ''),
    slug: raw.slug ? String(raw.slug) : undefined,
    status: raw.status ? String(raw.status) : undefined,
    max_users: raw.max_users !== undefined ? Number(raw.max_users) : undefined,
    address: String(raw.address ?? ''),
    phone: String(raw.phone ?? ''),
    city: String(raw.city ?? ''),
    state: String(raw.state ?? ''),
  };
}

export function useTenant() {
  const { data, error, isLoading, mutate } = useSWR<Record<string, unknown>>(
    `${API_BASE_URL}/tenants/me`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const tenant = useMemo(
    () => (data ? mapTenant(data) : null),
    [data],
  );

  return {
    tenant,
    isLoading,
    error,
    mutate,
  };
}

export async function updateTenantProfile(data: {
  name?: string;
  address?: string;
  phone?: string;
  city?: string;
  state?: string;
}) {
  try {
    const raw = await apiPatch<Record<string, unknown>>('/tenants/me', data);
    return mapTenant(raw);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('settings.business.error')));
  }
}
