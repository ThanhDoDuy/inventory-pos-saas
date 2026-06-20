import type { ProductImageItem } from './product-images';

/** Pick the best URL for a product thumbnail in list views. */
export function getProductListImageUrl(
  imageUrl?: string | null,
  images?: ProductImageItem[],
): string | null {
  const primary =
    images?.find((image) => image.is_primary) ?? images?.[0];

  if (primary?.urls?.list) {
    return primary.urls.list;
  }
  if (primary?.secure_url) {
    return primary.secure_url;
  }
  if (imageUrl?.trim()) {
    return imageUrl.trim();
  }
  return null;
}

/** Pick detail gallery URL with CDN transform when available. */
export function getProductDetailImageUrl(image: ProductImageItem): string {
  return image.urls?.detail || image.secure_url;
}
