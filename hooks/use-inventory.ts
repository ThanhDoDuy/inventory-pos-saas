import { useMemo } from 'react';
import useSWR from 'swr';
import { apiGet, apiPatch, apiPost, apiDelete, extractErrorMessage } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';
import { tMessage } from '@/lib/i18n/get-message';
import { DEFAULT_PAGE_SIZE, paginationFromListResponse } from '@/lib/pagination';
import type { ProductImageItem } from '@/lib/product-images';

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
  image_url?: string | null;
  images?: ProductImageItem[];
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

function mapProductImage(raw: Record<string, unknown>): ProductImageItem {
  const urlsRaw = raw.urls as Record<string, string> | undefined;
  return {
    id: stringifyId(raw.id ?? raw._id),
    public_id: String(raw.public_id ?? ''),
    secure_url: String(raw.secure_url ?? ''),
    width: Number(raw.width ?? 0),
    height: Number(raw.height ?? 0),
    format: String(raw.format ?? ''),
    bytes: Number(raw.bytes ?? 0),
    is_primary: Boolean(raw.is_primary),
    sort_order: Number(raw.sort_order ?? 0),
    uploaded_at: raw.uploaded_at ? String(raw.uploaded_at) : undefined,
    urls: {
      thumb: urlsRaw?.thumb ?? String(raw.secure_url ?? ''),
      list: urlsRaw?.list ?? String(raw.secure_url ?? ''),
      detail: urlsRaw?.detail ?? String(raw.secure_url ?? ''),
      zoom: urlsRaw?.zoom ?? String(raw.secure_url ?? ''),
    },
  };
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
    image_url: raw.image_url != null ? String(raw.image_url) : null,
    images: Array.isArray(raw.images)
      ? raw.images.map((item) => mapProductImage(item as Record<string, unknown>))
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
  options?: { categoryId?: string; limit?: number; page?: number },
) {
  const limit = options?.limit ?? DEFAULT_PAGE_SIZE;
  const page = options?.page ?? 1;
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });
  if (search) params.set('search', search);
  if (options?.categoryId) params.set('category_id', options.categoryId);

  const productsKey = `/products?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<ProductsListResponse>(
    productsKey,
    swrFetcher<ProductsListResponse>,
    { revalidateOnFocus: false, dedupingInterval: search ? 300 : 0 },
  );

  const products = (data?.items ?? []).map((item) => mapProduct(item as unknown as Record<string, unknown>));

  return {
    products,
    total: data?.total ?? 0,
    pagination: paginationFromListResponse(data),
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

export async function createCategory(data: { name: string; description?: string }) {
  try {
    return await apiPost('/categories', data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('categories.error.createFailed')));
  }
}

export async function updateCategory(
  id: string,
  data: { name?: string; description?: string },
) {
  try {
    return await apiPatch(`/categories/${id}`, data);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('categories.error.updateFailed')));
  }
}

export async function deleteCategory(id: string) {
  try {
    return await apiDelete(`/categories/${id}`);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('categories.error.deleteFailed')));
  }
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
    throw new Error(extractErrorMessage(error, tMessage('products.error.createFailed')));
  }
}

export async function updateProduct(productId: string, productData: Record<string, unknown>) {
  try {
    return await apiPatch(`/products/${productId}`, productData);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('products.error.updateFailed')));
  }
}

export async function deactivateProduct(productId: string) {
  try {
    return await apiPatch(`/products/${productId}/deactivate`, {});
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('products.error.deactivateFailed')));
  }
}
