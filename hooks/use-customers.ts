import useSWR from 'swr';
import { apiGet, apiPatch, apiPost, API_BASE_URL, extractErrorMessage } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';

const fetcher = (url: string) => apiGet(url.replace(API_BASE_URL, ''));

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status: string;
  last_purchase_at?: string;
  created_at?: string;
}

export interface CustomerHistory {
  count: number;
  total_spent: number;
  last_purchase_at?: string | null;
}

interface ListResponse {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

function mapCustomer(raw: Record<string, unknown>): CustomerItem {
  return {
    id: stringifyId(raw.id ?? raw._id),
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    email: raw.email ? String(raw.email) : undefined,
    address: raw.address ? String(raw.address) : undefined,
    status: String(raw.status ?? 'ACTIVE'),
    last_purchase_at: raw.last_purchase_at ? String(raw.last_purchase_at) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  };
}

export function useCustomers(search?: string, status?: string) {
  const params = new URLSearchParams({ limit: '50' });
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    `${API_BASE_URL}/customers?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  return {
    customers: (data?.items ?? []).map(mapCustomer),
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useCustomerHistory(customerId: string | null) {
  const { data, error, isLoading } = useSWR<CustomerHistory>(
    customerId ? `${API_BASE_URL}/customers/${customerId}/history` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { history: data, isLoading, error };
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}) {
  try {
    return await apiPost('/customers', data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể tạo khách hàng'));
  }
}

export async function updateCustomer(
  id: string,
  data: { name?: string; phone?: string; email?: string; address?: string },
) {
  try {
    return await apiPatch(`/customers/${id}`, data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể cập nhật khách hàng'));
  }
}

export async function disableCustomer(id: string) {
  try {
    return await apiPost(`/customers/${id}/disable`, {});
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể vô hiệu hóa khách hàng'));
  }
}
