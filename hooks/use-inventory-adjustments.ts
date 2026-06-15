import useSWR from 'swr';
import { apiGet, apiPost, API_BASE_URL, extractErrorMessage } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';

const fetcher = (url: string) => apiGet(url.replace(API_BASE_URL, ''));

export type AdjustmentReason = 'DAMAGE' | 'LOSS' | 'EXPIRED' | 'CORRECTION';

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  balance_after: number;
  reference_type: string;
  reference_id: string;
  note: string;
  created_at?: string;
  created_by: string;
}

interface ListResponse {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

function mapTransaction(raw: Record<string, unknown>): InventoryTransaction {
  return {
    id: stringifyId(raw.id ?? raw._id),
    productId: stringifyId(raw.productId ?? raw.product_id),
    type: String(raw.type ?? ''),
    quantity: Number(raw.quantity ?? 0),
    balance_after: Number(raw.balance_after ?? 0),
    reference_type: String(raw.reference_type ?? ''),
    reference_id: String(raw.reference_id ?? ''),
    note: String(raw.note ?? ''),
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    created_by: stringifyId(raw.created_by),
  };
}

export function useInventoryTransactions(type = 'ADJUST') {
  const params = new URLSearchParams({ limit: '50', type });

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    `${API_BASE_URL}/inventory/transactions?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  return {
    transactions: (data?.items ?? []).map(mapTransaction),
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export async function createAdjustment(data: {
  productId: string;
  quantity: number;
  reason: AdjustmentReason;
  note?: string;
}) {
  try {
    return await apiPost('/inventory/adjustment', data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể điều chỉnh kho'));
  }
}
