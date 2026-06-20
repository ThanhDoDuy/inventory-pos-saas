'use client';

import Image from 'next/image';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_COUNT,
  PRODUCT_IMAGE_MIME_TYPES,
} from '@/lib/product-images';
import { useTranslation } from '@/lib/i18n/use-translation';

interface ProductImagePendingUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  error?: string;
  onError?: (message: string) => void;
}

export function ProductImagePendingUpload({
  files,
  onChange,
  disabled = false,
  error,
  onError,
}: ProductImagePendingUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const preview of previews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [previews]);

  const handleSelect = (selected: FileList | null) => {
    if (!selected?.length || disabled) {
      return;
    }

    const next = [...files];
    for (const file of Array.from(selected)) {
      if (next.length >= PRODUCT_IMAGE_MAX_COUNT) {
        onError?.(t('products.images.error.limitReached'));
        break;
      }
      if (!PRODUCT_IMAGE_MIME_TYPES.has(file.type)) {
        onError?.(t('products.images.error.invalidType'));
        continue;
      }
      if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
        onError?.(t('products.images.error.tooLarge'));
        continue;
      }
      next.push(file);
    }

    onChange(next);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{t('products.images.addInCreate')}</p>
          <p className="text-xs text-muted-foreground">
            {t('products.images.hint', { max: PRODUCT_IMAGE_MAX_COUNT })}
          </p>
        </div>
        {files.length < PRODUCT_IMAGE_MAX_COUNT && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              multiple
              className="hidden"
              disabled={disabled}
              onChange={(e) => handleSelect(e.target.files)}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors disabled:opacity-50 shrink-0"
            >
              {disabled ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Upload size={14} />
              )}
              {t('products.images.upload')}
            </button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {previews.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((preview, index) => (
            <div
              key={`${preview.file.name}-${index}`}
              className="relative aspect-square rounded-lg border border-border overflow-hidden bg-secondary/30 group"
            >
              <Image
                src={preview.url}
                alt={preview.file.name}
                fill
                className="object-cover"
                sizes="120px"
                unoptimized
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute inset-x-0 bottom-0 flex items-center justify-center py-1.5 bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t('products.images.delete')}
                >
                  <Trash2 size={14} />
                </button>
              )}
              {index === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary text-primary-foreground">
                  {t('products.images.primary')}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 border border-dashed border-border rounded-lg text-muted-foreground">
          <Upload size={24} className="mb-1 opacity-50" />
          <p className="text-xs">{t('products.images.empty')}</p>
        </div>
      )}
    </div>
  );
}
