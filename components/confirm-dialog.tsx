'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={cancelText}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60"
        disabled={isLoading}
      />
      <div className="relative bg-card rounded-xl border border-border w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-secondary rounded-lg"
            disabled={isLoading}
            aria-label={cancelText}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 text-sm text-muted-foreground">
          <p className="text-foreground">{message}</p>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

