export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MAX_COUNT = 10;

export const PRODUCT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

export const PRODUCT_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export interface ProductImageUrls {
  thumb: string;
  list: string;
  detail: string;
  zoom: string;
}

export interface ProductImageItem {
  id: string;
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  is_primary: boolean;
  sort_order: number;
  uploaded_at?: string;
  urls: ProductImageUrls;
}

export interface ProductImagesResponse {
  images: ProductImageItem[];
  primary_image_url: string | null;
}

export interface SignProductImageResponse {
  signature: string;
  timestamp: number;
  folder: string;
  public_id: string;
  api_key: string;
  cloud_name: string;
  upload_url: string;
  transformation: string;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  etag?: string;
  error?: { message: string };
}
