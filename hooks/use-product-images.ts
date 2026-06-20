import useSWR from 'swr';
import { apiDelete, apiGet, apiPatch, apiPost, extractErrorMessage } from '@/lib/api-client';
import {
  type CloudinaryUploadResult,
  type ProductImagesResponse,
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_COUNT,
  PRODUCT_IMAGE_MIME_TYPES,
  type SignProductImageResponse,
} from '@/lib/product-images';
import { tMessage } from '@/lib/i18n/get-message';

async function fetchImages(productId: string): Promise<ProductImagesResponse> {
  return apiGet<ProductImagesResponse>(`/products/${productId}/images`);
}

export function useProductImages(productId: string) {
  const key = productId ? `/products/${productId}/images` : null;
  const { data, error, isLoading, mutate } = useSWR(key, () => fetchImages(productId), {
    revalidateOnFocus: false,
  });

  return {
    images: data?.images ?? [],
    primaryImageUrl: data?.primary_image_url ?? null,
    isLoading,
    error,
    mutate,
  };
}

function validateFile(file: File): void {
  if (!PRODUCT_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error(tMessage('products.images.error.invalidType'));
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error(tMessage('products.images.error.tooLarge'));
  }
}

export async function uploadProductImage(
  productId: string,
  file: File,
  currentCount: number,
): Promise<ProductImagesResponse> {
  validateFile(file);

  if (currentCount >= PRODUCT_IMAGE_MAX_COUNT) {
    throw new Error(tMessage('products.images.error.limitReached'));
  }

  let sign: SignProductImageResponse;
  try {
    sign = await apiPost<SignProductImageResponse>(`/products/${productId}/images/sign`, {});
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('products.images.error.signFailed')));
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sign.api_key);
  formData.append('timestamp', String(sign.timestamp));
  formData.append('signature', sign.signature);
  formData.append('public_id', sign.public_id);
  formData.append('folder', sign.folder);
  formData.append('transformation', sign.transformation);

  const uploadResponse = await fetch(sign.upload_url, {
    method: 'POST',
    body: formData,
  });

  const uploadResult = (await uploadResponse.json()) as CloudinaryUploadResult;
  if (!uploadResponse.ok) {
    throw new Error(
      uploadResult.error?.message ?? tMessage('products.images.error.uploadFailed'),
    );
  }

  try {
    return await apiPost<ProductImagesResponse>(`/products/${productId}/images/confirm`, {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      etag: uploadResult.etag,
    });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('products.images.error.confirmFailed')));
  }
}

export async function setProductImagePrimary(productId: string, imageId: string) {
  try {
    return await apiPatch<ProductImagesResponse>(
      `/products/${productId}/images/${imageId}/primary`,
      {},
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('products.images.error.primaryFailed')));
  }
}

export async function deleteProductImage(productId: string, imageId: string) {
  try {
    return await apiDelete<ProductImagesResponse>(
      `/products/${productId}/images/${imageId}`,
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('products.images.error.deleteFailed')));
  }
}

export { PRODUCT_IMAGE_ACCEPT, PRODUCT_IMAGE_MAX_COUNT };
