import { useMemo } from 'react';
import useSWR from 'swr';
import { apiGet, apiPost, API_BASE_URL, extractErrorMessage } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';

const fetcher = (url: string) => apiGet(url.replace(API_BASE_URL, ''));

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'E_WALLET';

export interface CreateInvoiceItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
  priceTierCode?: string;
}

export interface CreateInvoicePayload {
  items: CreateInvoiceItem[];
  customerId?: string;
  discount?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  paymentMethod: PaymentMethod;
}

export interface InvoiceItem {
  id: string;
  invoice_number?: string;
  total: number;
  status: string;
  payment_method?: string;
  created_at?: string;
  item_count?: number;
}

export interface InvoiceDetailItem {
  id: string;
  product_id: string;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  price_tier_code?: string;
  price_tier_label?: string;
}

export interface InvoiceDetail extends InvoiceItem {
  subtotal: number;
  discount: number;
  tax: number;
  items: InvoiceDetailItem[];
}

interface InvoicesListResponse {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

export function mapPaymentMethod(method: string): PaymentMethod {
  switch (method) {
    case 'transfer':
      return 'BANK_TRANSFER';
    case 'cash':
    default:
      return 'CASH';
  }
}

export async function createInvoice(payload: CreateInvoicePayload) {
  try {
    const raw = await apiPost<Record<string, unknown>>('/invoices', payload);
    return mapInvoiceDetail(raw);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Thanh toán thất bại'));
  }
}

export async function getInvoice(id: string) {
  try {
    const raw = await apiGet<Record<string, unknown>>(`/invoices/${id}`);
    return mapInvoiceDetail(raw);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không tải được hóa đơn'));
  }
}

function mapInvoiceDetail(raw: Record<string, unknown>): InvoiceDetail {
  const items = (raw.items as Record<string, unknown>[] | undefined) ?? [];
  return {
    id: stringifyId(raw.id ?? raw._id),
    invoice_number: raw.invoice_number ? String(raw.invoice_number) : undefined,
    total: Number(raw.total ?? 0),
    subtotal: Number(raw.subtotal ?? 0),
    discount: Number(raw.discount ?? 0),
    tax: Number(raw.tax ?? 0),
    status: String(raw.status ?? ''),
    payment_method: raw.payment_method ? String(raw.payment_method) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    items: items.map((item) => ({
      id: stringifyId(item.id ?? item._id),
      product_id: stringifyId(item.product_id),
      product_name: item.product_name ? String(item.product_name) : null,
      quantity: Number(item.quantity ?? 0),
      unit_price: Number(item.unit_price ?? 0),
      total: Number(item.total ?? 0),
      price_tier_code: item.price_tier_code ? String(item.price_tier_code) : undefined,
      price_tier_label: item.price_tier_label ? String(item.price_tier_label) : undefined,
    })),
  };
}

export function invoiceToReceiptData(
  invoice: InvoiceDetail,
  extras?: {
    storeName?: string;
    amountPaid?: number;
    change?: number;
    notes?: string;
  },
) {
  return {
    invoiceNumber: invoice.invoice_number ?? invoice.id.slice(-8).toUpperCase(),
    createdAt: invoice.created_at,
    storeName: extras?.storeName,
    items: invoice.items.map((item) => ({
      name: item.product_name ?? 'Sản phẩm',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.total,
      priceTierLabel: item.price_tier_label,
    })),
    subtotal: invoice.subtotal,
    discountPercent: invoice.discount,
    tax: invoice.tax,
    total: invoice.total,
    paymentMethod: invoice.payment_method ?? 'CASH',
    amountPaid: extras?.amountPaid,
    change: extras?.change,
    notes: extras?.notes,
  };
}

export function useInvoices(from?: string, to?: string, limit = 20) {
  const swrKey = useMemo(() => {
    if (!from || !to) return null;
    const params = new URLSearchParams({ limit: String(limit), from, to });
    return `${API_BASE_URL}/invoices?${params.toString()}`;
  }, [from, to, limit]);

  const { data, error, isLoading, mutate } = useSWR<InvoicesListResponse>(
    swrKey,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const invoices: InvoiceItem[] = (data?.items ?? []).map((raw) => ({
    id: stringifyId(raw.id ?? raw._id),
    invoice_number: raw.invoice_number ? String(raw.invoice_number) : undefined,
    total: Number(raw.total ?? 0),
    status: String(raw.status ?? ''),
    payment_method: raw.payment_method ? String(raw.payment_method) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    item_count: raw.item_count !== undefined ? Number(raw.item_count) : undefined,
  }));

  return { invoices, total: data?.total ?? 0, isLoading, error, mutate };
}
