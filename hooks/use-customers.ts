import useSWR from 'swr';
import { apiGet, apiPatch, apiPost, API_BASE_URL, extractErrorMessage, swrFetcher as fetcher } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';
import { tMessage } from '@/lib/i18n/get-message';
import { DEFAULT_PAGE_SIZE, paginationFromListResponse } from '@/lib/pagination';

export type CustomerType = 'INDIVIDUAL' | 'COMPANY' | 'GROUP';

export interface CustomerItem {
  id: string;
  customer_type: CustomerType;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tax_code?: string;
  contact_person?: string;
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
    customer_type: (raw.customer_type as CustomerType) ?? 'INDIVIDUAL',
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    email: raw.email ? String(raw.email) : undefined,
    address: raw.address ? String(raw.address) : undefined,
    tax_code: raw.tax_code ? String(raw.tax_code) : undefined,
    contact_person: raw.contact_person ? String(raw.contact_person) : undefined,
    status: String(raw.status ?? 'ACTIVE'),
    last_purchase_at: raw.last_purchase_at ? String(raw.last_purchase_at) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  };
}

export function useCustomers(
  search?: string,
  status?: string,
  customerType?: string,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
) {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  if (customerType && customerType !== 'all') {
    params.set('customer_type', customerType);
  }

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    `${API_BASE_URL}/customers?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  return {
    customers: (data?.items ?? []).map(mapCustomer),
    total: data?.total ?? 0,
    pagination: paginationFromListResponse(data),
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
  customer_type: CustomerType;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tax_code?: string;
  contact_person?: string;
}) {
  try {
    return await apiPost('/customers', data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('customers.error.actionFailed')));
  }
}

export async function updateCustomer(
  id: string,
  data: {
    customer_type?: CustomerType;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    tax_code?: string;
    contact_person?: string;
  },
) {
  try {
    return await apiPatch(`/customers/${id}`, data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('customers.error.actionFailed')));
  }
}

export async function disableCustomer(id: string) {
  try {
    return await apiPost(`/customers/${id}/disable`, {});
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('customers.error.disableFailed')));
  }
}

export async function activateCustomer(id: string) {
  try {
    return await apiPost(`/customers/${id}/activate`, {});
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('customers.error.activateFailed')));
  }
}
