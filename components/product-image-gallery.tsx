'use client';

import Image from 'next/image';
import { Loader2, Star, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  deleteProductImage,
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_COUNT,
  setProductImagePrimary,
  uploadProductImage,
  useProductImages,
} from '@/hooks/use-product-images';
import { ConfirmModal } from '@/components/confirm-modal';
import { getProductDetailImageUrl } from '@/lib/cloudinary-url';
import { useTranslation } from '@/lib/i18n/use-translation';

interface ProductImageGalleryProps {
  productId: string;
  canEdit?: boolean;
}

export function ProductImageGallery({
  productId,
  canEdit = true,
}: ProductImageGalleryProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { images, isLoading, mutate } = useProductImages(productId);
  const [isUploading, setIsUploading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !canEdit) {
      return;
    }

    setError('');
    setIsUploading(true);
    try {
      let count = images.length;
      for (const file of Array.from(files)) {
        if (count >= PRODUCT_IMAGE_MAX_COUNT) {
          break;
        }
        await uploadProductImage(productId, file, count);
        count += 1;
      }
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.images.error.uploadFailed'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    setError('');
    setActionId(imageId);
    try {
      await setProductImagePrimary(productId, imageId);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.images.error.primaryFailed'));
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) {
      return;
    }

    const imageId = deleteTargetId;
    setError('');
    setActionId(imageId);
    try {
      await deleteProductImage(productId, imageId);
      await mutate();
      setDeleteTargetId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.images.error.deleteFailed'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title={t('products.images.delete')}
        message={t('products.images.confirm.delete')}
        confirmLabel={t('common.remove')}
        variant="destructive"
        isLoading={actionId === deleteTargetId && deleteTargetId !== null}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />

    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">{t('products.images.title')}</h2>
        {canEdit && images.length < PRODUCT_IMAGE_MAX_COUNT && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => void handleUpload(e.target.files)}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Upload size={16} />
              )}
              {t('products.images.upload')}
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        {t('products.images.hint', {
          max: PRODUCT_IMAGE_MAX_COUNT,
        })}
      </p>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="animate-spin" size={20} />
          {t('common.loading')}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-lg text-muted-foreground">
          <Upload size={32} className="mb-2 opacity-50" />
          <p className="text-sm">{t('products.images.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image) => {
            const src = getProductDetailImageUrl(image);
            const isBusy = actionId === image.id;

            return (
              <div
                key={image.id}
                className="relative group rounded-lg border border-border overflow-hidden bg-secondary/30"
              >
                <div className="relative aspect-square">
                  <Image
                    src={src}
                    alt={image.public_id}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 200px"
                    unoptimized={!src.includes('res.cloudinary.com')}
                  />
                </div>

                {image.is_primary && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold rounded bg-primary text-primary-foreground">
                    {t('products.images.primary')}
                  </span>
                )}

                {canEdit && (
                  <div className="absolute inset-x-0 bottom-0 flex gap-1 p-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!image.is_primary && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleSetPrimary(image.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded bg-white/90 text-foreground hover:bg-white disabled:opacity-50"
                        title={t('products.images.setPrimary')}
                      >
                        {isBusy ? (
                          <Loader2 className="animate-spin" size={12} />
                        ) : (
                          <Star size={12} />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setDeleteTargetId(image.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded bg-destructive/90 text-destructive-foreground hover:bg-destructive disabled:opacity-50"
                      title={t('products.images.delete')}
                    >
                      {isBusy ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}
