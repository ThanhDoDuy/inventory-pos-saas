import { useMemo } from 'react';
import useSWR from 'swr';
import { apiGet, apiPatch, apiPost, extractErrorMessage } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';

async function swrFetcher<T>(path: string): Promise<T> {
  return apiGet<T>(path);
}

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  selling_price: number;
  prices?: Record<string, number>;
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
  const categoryRaw = raw.category as { id?: unknown; _id?: unknown; name?: string } | undefined;
  const categoryIdRaw = raw.category_id as { id?: unknown; _id?: unknown; name?: string } | undefined;
  const populatedCategory = categoryRaw ?? categoryIdRaw;

  return {
    id: stringifyId(raw.id ?? raw._id),
    sku: String(raw.sku ?? ''),
    name: String(raw.name ?? ''),
    selling_price: Number(raw.selling_price ?? 0),
    prices:
      raw.prices && typeof raw.prices === 'object'
        ? Object.fromEntries(
            Object.entries(raw.prices as Record<string, unknown>).map(([k, v]) => [
              k,
              Number(v),
            ]),
          )
        : undefined,
    cost_price: raw.cost_price != null ? Number(raw.cost_price) : undefined,
    stock: Number(raw.stock ?? 0),
    minimum_stock: raw.minimum_stock != null ? Number(raw.minimum_stock) : undefined,
    status: String(raw.status ?? 'ACTIVE'),
    barcode: raw.barcode != null ? String(raw.barcode) : null,
    category_id: raw.category_id
      ? stringifyId(
          typeof raw.category_id === 'object'
            ? (raw.category_id as { id?: unknown; _id?: unknown }).id ??
                (raw.category_id as { _id?: unknown })._id
            : raw.category_id,
        )
      : null,
    category: populatedCategory
      ? {
          id: stringifyId(populatedCategory.id ?? populatedCategory._id),
          name: String(populatedCategory.name ?? ''),
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

export function useProducts(
  search?: string,
  options?: { categoryId?: string; limit?: number },
) {
  const limit = options?.limit ?? 100;
  const params = new URLSearchParams({ limit: String(limit) });
  if (search) params.set('search', search);
  if (options?.categoryId) params.set('category_id', options.categoryId);

  const productsKey = `/products?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<ProductsListResponse>(
    productsKey,
    swrFetcher<ProductsListResponse>,
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
    '/categories?limit=100',
    swrFetcher<CategoriesListResponse>,
    { revalidateOnFocus: false },
  );

  const categories = (data?.items ?? []).map((item) => mapCategory(item as unknown as Record<string, unknown>));

  return { categories, isLoading, error, mutate };
}

export function useProduct(productId: string) {
  const productKey = productId ? `/products/${productId}` : null;

  const { data, error, isLoading, mutate } = useSWR<Record<string, unknown>>(
    productKey,
    swrFetcher<Record<string, unknown>>,
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
