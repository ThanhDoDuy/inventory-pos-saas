'use client';

import { Loader2, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  message,
  title,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  const confirmClassName =
    variant === 'destructive'
      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      : 'bg-primary text-primary-foreground hover:bg-primary/90';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onCancel}
        disabled={isLoading}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-card rounded-xl border border-border shadow-2xl w-full max-w-md p-6"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
        >
          <X size={18} />
        </button>

        {title && (
          <h2 className="text-lg font-bold text-foreground mb-2 pr-8">{title}</h2>
        )}
        <p className="text-sm text-muted-foreground mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2 px-4 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors text-foreground disabled:opacity-50"
          >
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${confirmClassName}`}
          >
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            {confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
