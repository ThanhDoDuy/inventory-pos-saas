import useSWR from 'swr';
import { apiGet, apiPost, API_BASE_URL, extractErrorMessage } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';

const fetcher = (url: string) => apiGet(url.replace(API_BASE_URL, ''));

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  quantity: number;
  received_quantity: number;
  cost_price: number;
  remaining_quantity: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplierId: string;
  status: string;
  total_amount: number;
  expected_date?: string;
  cancel_reason?: string;
  created_at?: string;
  items?: PurchaseOrderItem[];
}

interface ListResponse {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

function mapPoItem(raw: Record<string, unknown>): PurchaseOrderItem {
  return {
    id: stringifyId(raw.id ?? raw._id),
    productId: stringifyId(raw.productId ?? raw.product_id),
    quantity: Number(raw.quantity ?? 0),
    received_quantity: Number(raw.received_quantity ?? 0),
    cost_price: Number(raw.cost_price ?? 0),
    remaining_quantity: Number(raw.remaining_quantity ?? 0),
  };
}

function mapPurchaseOrder(raw: Record<string, unknown>): PurchaseOrder {
  const items = raw.items as Record<string, unknown>[] | undefined;
  return {
    id: stringifyId(raw.id ?? raw._id),
    po_number: String(raw.po_number ?? ''),
    supplierId: stringifyId(raw.supplierId ?? raw.supplier_id),
    status: String(raw.status ?? ''),
    total_amount: Number(raw.total_amount ?? 0),
    expected_date: raw.expected_date ? String(raw.expected_date) : undefined,
    cancel_reason: raw.cancel_reason ? String(raw.cancel_reason) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    items: items?.map(mapPoItem),
  };
}

export function usePurchaseOrders(status?: string, supplierId?: string) {
  const params = new URLSearchParams({ limit: '50' });
  if (status && status !== 'all') params.set('status', status);
  if (supplierId) params.set('supplierId', supplierId);

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    `${API_BASE_URL}/purchase-orders?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  return {
    orders: (data?.items ?? []).map(mapPurchaseOrder),
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function usePurchaseOrder(orderId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Record<string, unknown>>(
    orderId ? `${API_BASE_URL}/purchase-orders/${orderId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    order: data ? mapPurchaseOrder(data) : undefined,
    isLoading,
    error,
    mutate,
  };
}

export async function createPurchaseOrder(data: {
  supplierId: string;
  items: { productId: string; quantity: number; costPrice: number }[];
  expectedDate?: string;
}) {
  try {
    return await apiPost('/purchase-orders', data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể tạo đơn nhập hàng'));
  }
}

export async function approvePurchaseOrder(id: string) {
  try {
    return await apiPost(`/purchase-orders/${id}/approve`, {});
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể duyệt đơn'));
  }
}

export async function receivePurchaseOrder(
  id: string,
  items: { productId: string; receivedQuantity: number }[],
) {
  try {
    return await apiPost(`/purchase-orders/${id}/receive`, { items });
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể nhận hàng'));
  }
}

export async function cancelPurchaseOrder(id: string, reason: string) {
  try {
    return await apiPost(`/purchase-orders/${id}/cancel`, { reason });
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể hủy đơn'));
  }
}
