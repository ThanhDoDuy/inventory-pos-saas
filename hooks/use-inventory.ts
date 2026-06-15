import { useMemo } from 'react';
import useSWR from 'swr';
import { apiGet, apiPatch, apiPost, API_BASE_URL, extractErrorMessage } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';

const fetcher = (url: string) => apiGet(url.replace(API_BASE_URL, ''));

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  selling_price: number;
  cost_price?: number;
  stock: number;
  minimum_stock?: number;
  status: string;
  barcode?: string | null;
  category?: { id: string; name: string };
  category_id?: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
}

export interface ProductsListResponse {
  items: ProductItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoriesListResponse {
  items: CategoryItem[];
  total: number;
  page: number;
  limit: number;
}

function mapProduct(raw: Record<string, unknown>): ProductItem {
  return {
    ...(raw as unknown as ProductItem),
    id: stringifyId(raw.id ?? raw._id),
    category: raw.category
      ? {
          id: stringifyId((raw.category as { id?: unknown; _id?: unknown }).id ?? (raw.category as { _id?: unknown })._id),
          name: String((raw.category as { name?: string }).name ?? ''),
        }
      : undefined,
  };
}

function mapCategory(raw: Record<string, unknown>): CategoryItem {
  return {
    id: stringifyId(raw.id ?? raw._id),
    name: String(raw.name ?? ''),
    description: raw.description ? String(raw.description) : undefined,
  };
}

export function useProducts(search?: string, limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (search) params.set('search', search);

  const { data, error, isLoading, mutate } = useSWR<ProductsListResponse>(
    `${API_BASE_URL}/products?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const products = (data?.items ?? []).map((item) => mapProduct(item as unknown as Record<string, unknown>));

  return {
    products,
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<CategoriesListResponse>(
    `${API_BASE_URL}/categories?limit=100`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const categories = (data?.items ?? []).map((item) => mapCategory(item as unknown as Record<string, unknown>));

  return { categories, isLoading, error, mutate };
}

export function useProduct(productId: string) {
  const { data, error, isLoading, mutate } = useSWR<Record<string, unknown>>(
    productId ? `${API_BASE_URL}/products/${productId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const product = useMemo(
    () => (data ? mapProduct(data) : undefined),
    [data],
  );

  return {
    product,
    isLoading,
    error,
    mutate,
  };
}

export async function createProduct(productData: Record<string, unknown>) {
  try {
    return await apiPost('/products', productData);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể tạo sản phẩm'));
  }
}

export async function updateProduct(productId: string, productData: Record<string, unknown>) {
  try {
    return await apiPatch(`/products/${productId}`, productData);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể cập nhật sản phẩm'));
  }
}

export async function deactivateProduct(productId: string) {
  try {
    return await apiPatch(`/products/${productId}/deactivate`, {});
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Không thể ngừng bán sản phẩm'));
  }
}
