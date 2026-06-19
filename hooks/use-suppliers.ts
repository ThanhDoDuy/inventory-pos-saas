import useSWR from 'swr';
import { apiGet, apiPatch, apiPost, API_BASE_URL, extractErrorMessage, swrFetcher as fetcher } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';

export interface SupplierItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tax_code?: string;
  status: string;
  created_at?: string;
}

export interface SupplierHistory {
  count: number;
  total_amount: number;
  last_order_at?: string | null;
}

interface ListResponse {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

function mapSupplier(raw: Record<string, unknown>): SupplierItem {
  return {
    id: stringifyId(raw.id ?? raw._id),
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    email: raw.email ? String(raw.email) : undefined,
    address: raw.address ? String(raw.address) : undefined,
    tax_code: raw.tax_code ? String(raw.tax_code) : undefined,
    status: String(raw.status ?? 'ACTIVE'),
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  };
}

export function useSuppliers(search?: string, status?: string) {
  const params = new URLSearchParams({ limit: '50' });
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    `${API_BASE_URL}/suppliers?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  return {
    suppliers: (data?.items ?? []).map(mapSupplier),
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useSupplierHistory(supplierId: string | null) {
  const { data, error, isLoading } = useSWR<SupplierHistory>(
    supplierId ? `${API_BASE_URL}/suppliers/${supplierId}/history` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { history: data, isLoading, error };
}

export async function createSupplier(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tax_code?: string;
}) {
  try {
    return await apiPost('/suppliers', data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể tạo nhà cung cấp'));
  }
}

export async function updateSupplier(
  id: string,
  data: { name?: string; phone?: string; email?: string; address?: string; tax_code?: string },
) {
  try {
    return await apiPatch(`/suppliers/${id}`, data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể cập nhật nhà cung cấp'));
  }
}

export async function disableSupplier(id: string) {
  try {
    return await apiPost(`/suppliers/${id}/disable`, {});
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể vô hiệu hóa nhà cung cấp'));
  }
}

export async function activateSupplier(id: string) {
  try {
    return await apiPost(`/suppliers/${id}/activate`, {});
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể kích hoạt lại nhà cung cấp'));
  }
}
