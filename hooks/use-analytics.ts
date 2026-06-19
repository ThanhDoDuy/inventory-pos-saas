import { useMemo } from 'react';
import useSWR from 'swr';
import { apiGet, API_BASE_URL, downloadFile, swrFetcher as fetcher } from '@/lib/api-client';
import type { DateRangePreset } from '@/lib/format';
import { getDateRange } from '@/lib/format';

export interface DashboardData {
  revenue_today: number;
  revenue_month: number;
  orders_today: number;
  products_sold_today: number;
  low_stock_count: number;
  top_products: Array<{
    product_id: string;
    product_name?: string;
    sku?: string;
    quantity_sold: number;
    revenue: number;
  }>;
  generated_at: string;
}

export interface RevenueData {
  total_revenue: number;
  from: string;
  to: string;
  daily: Array<{ _id: string; revenue: number; orders: number }>;
}

export interface TopProductRow {
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity_sold: number;
  revenue: number;
}

export interface LowStockRow {
  product_id: string;
  name: string;
  sku: string;
  minimum_stock: number;
  available_quantity: number;
}

export interface DeadStockRow {
  product_id: string;
  name: string;
  sku: string;
  available_quantity: number;
  stock_value: number;
  inactive_days: number;
}

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    `${API_BASE_URL}/reports/dashboard`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 300_000 },
  );

  return { dashboard: data, isLoading, error, mutate };
}

export function useRevenue(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const { data, error, isLoading } = useSWR<RevenueData>(
    from && to ? `${API_BASE_URL}/reports/revenue${qs}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  return { revenue: data, isLoading, error };
}

export function useRevenueByPreset(preset: DateRangePreset) {
  const { from, to } = useMemo(() => getDateRange(preset), [preset]);
  return useRevenue(from, to);
}

export function useTopProducts(from?: string, to?: string, limit = 10) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  params.set('limit', String(limit));
  const qs = `?${params.toString()}`;

  const { data, error, isLoading } = useSWR<TopProductRow[]>(
    from && to ? `${API_BASE_URL}/reports/top-products${qs}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  return { products: data ?? [], isLoading, error };
}

export function useTopProductsByPreset(preset: DateRangePreset, limit = 10) {
  const { from, to } = useMemo(() => getDateRange(preset), [preset]);
  return useTopProducts(from, to, limit);
}

export function useLowStock() {
  const { data, error, isLoading } = useSWR<LowStockRow[]>(
    `${API_BASE_URL}/reports/low-stock`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { lowStock: data ?? [], isLoading, error };
}

export function useDeadStock(inactiveDays = 30) {
  const { data, error, isLoading, mutate } = useSWR<DeadStockRow[]>(
    `${API_BASE_URL}/reports/dead-stock?inactiveDays=${inactiveDays}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const deadStock = (data ?? []).map((row) => ({
    product_id: String(row.product_id ?? ''),
    name: String(row.name ?? ''),
    sku: String(row.sku ?? ''),
    available_quantity: Number(row.available_quantity ?? 0),
    stock_value: Number(row.stock_value ?? 0),
    inactive_days: Number(row.inactive_days ?? inactiveDays),
  }));

  return { deadStock, isLoading, error, mutate };
}

export async function exportReport(
  type: 'REVENUE' | 'TOP_PRODUCTS' | 'LOW_STOCK' | 'DEAD_STOCK',
  params?: { from?: string; to?: string; inactiveDays?: string },
) {
  await downloadFile('/reports/export', `report-${type.toLowerCase()}.csv`, {
    type,
    format: 'csv',
    ...(params?.from ? { from: params.from } : {}),
    ...(params?.to ? { to: params.to } : {}),
    ...(params?.inactiveDays ? { inactiveDays: params.inactiveDays } : {}),
  });
}
