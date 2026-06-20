import { useMemo } from 'react';
import useSWR from 'swr';
import { apiGet, apiPost, API_BASE_URL, extractErrorMessage, swrFetcher as fetcher } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';
import { getUnnamedProductLabel } from '@/lib/i18n/receipt-labels';
import { tMessage } from '@/lib/i18n/get-message';
import { DEFAULT_PAGE_SIZE, paginationFromListResponse } from '@/lib/pagination';
import type { CustomerItem } from '@/hooks/use-customers';
import type { ReceiptCustomer } from '@/lib/print-receipt';

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

export interface InvoiceCustomer {
  id: string;
  name: string;
  customer_type?: string;
  tax_code?: string;
  address?: string;
  phone?: string;
  contact_person?: string;
}

export interface InvoiceRefundLine {
  product_id: string;
  quantity: number;
}

export interface InvoiceRefund {
  id: string;
  items: InvoiceRefundLine[];
  amount: number;
  reason?: string;
  created_at?: string;
}

export interface InvoiceDetail extends InvoiceItem {
  subtotal: number;
  discount: number;
  tax: number;
  customer_id?: string | null;
  customer?: InvoiceCustomer | null;
  refunds?: InvoiceRefund[];
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

export function customerToReceiptCustomer(
  customer: InvoiceCustomer | CustomerItem,
): ReceiptCustomer {
  return {
    name: customer.name,
    taxCode: customer.tax_code || undefined,
    address: customer.address || undefined,
    phone: customer.phone || undefined,
  };
}

export async function createInvoice(payload: CreateInvoicePayload) {
  try {
    const raw = await apiPost<Record<string, unknown>>('/invoices', payload);
    return mapInvoiceDetail(raw);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('pos.payment.failed')));
  }
}

export async function getInvoice(id: string) {
  try {
    const raw = await apiGet<Record<string, unknown>>(`/invoices/${id}`);
    return mapInvoiceDetail(raw);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('invoices.error.loadFailed')));
  }
}

export async function cancelInvoice(id: string, reason?: string) {
  try {
    const raw = await apiPost<Record<string, unknown>>(`/invoices/${id}/cancel`, {
      reason: reason?.trim() || undefined,
    });
    return mapInvoiceDetail(raw);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('invoices.error.cancelFailed')));
  }
}

export async function refundInvoice(
  id: string,
  items: Array<{ productId: string; quantity: number }>,
  reason?: string,
) {
  try {
    const raw = await apiPost<Record<string, unknown>>(`/invoices/${id}/refund`, {
      items,
      reason: reason?.trim() || undefined,
    });
    return mapInvoiceDetail(raw);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('invoices.error.refundFailed')));
  }
}

function mapInvoiceCustomer(raw: Record<string, unknown> | undefined): InvoiceCustomer | null {
  if (!raw) return null;
  return {
    id: stringifyId(raw.id ?? raw._id),
    name: String(raw.name ?? ''),
    customer_type: raw.customer_type ? String(raw.customer_type) : undefined,
    tax_code: raw.tax_code ? String(raw.tax_code) : undefined,
    address: raw.address ? String(raw.address) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    contact_person: raw.contact_person ? String(raw.contact_person) : undefined,
  };
}

function mapInvoiceDetail(raw: Record<string, unknown>): InvoiceDetail {
  const items = (raw.items as Record<string, unknown>[] | undefined) ?? [];
  const refunds = (raw.refunds as Record<string, unknown>[] | undefined) ?? [];
  const customerRaw = raw.customer as Record<string, unknown> | undefined;

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
    customer_id: raw.customer_id ? String(raw.customer_id) : null,
    customer: mapInvoiceCustomer(customerRaw),
    refunds: refunds.map((refund) => {
      const refundItems = (refund.items as Record<string, unknown>[] | undefined) ?? [];
      return {
        id: stringifyId(refund.id ?? refund._id),
        items: refundItems.map((line) => ({
          product_id: stringifyId(line.product_id),
          quantity: Number(line.quantity ?? 0),
        })),
        amount: Number(refund.amount ?? 0),
        reason: refund.reason ? String(refund.reason) : undefined,
        created_at: refund.created_at ? String(refund.created_at) : undefined,
      };
    }),
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
    storeAddress?: string;
    storePhone?: string;
    customer?: ReceiptCustomer;
    amountPaid?: number;
    change?: number;
    notes?: string;
  },
) {
  const customer =
    extras?.customer ??
    (invoice.customer ? customerToReceiptCustomer(invoice.customer) : undefined);

  return {
    invoiceNumber: invoice.invoice_number ?? invoice.id.slice(-8).toUpperCase(),
    createdAt: invoice.created_at,
    storeName: extras?.storeName,
    storeAddress: extras?.storeAddress,
    storePhone: extras?.storePhone,
    customer,
    items: invoice.items.map((item) => ({
      name: item.product_name ?? getUnnamedProductLabel(),
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

export function getRefundedQuantity(invoice: InvoiceDetail, productId: string): number {
  return (invoice.refunds ?? []).reduce((sum, refund) => {
    const line = refund.items.find((item) => item.product_id === productId);
    return sum + (line?.quantity ?? 0);
  }, 0);
}

export function useInvoices(
  from?: string,
  to?: string,
  options?: { page?: number; limit?: number },
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? DEFAULT_PAGE_SIZE;

  const swrKey = useMemo(() => {
    if (!from || !to) return null;
    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      from,
      to,
    });
    return `${API_BASE_URL}/invoices?${params.toString()}`;
  }, [from, to, limit, page]);

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

  return {
    invoices,
    total: data?.total ?? 0,
    pagination: paginationFromListResponse(data),
    isLoading,
    error,
    mutate,
  };
}
