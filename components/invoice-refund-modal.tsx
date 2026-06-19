'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  getInvoice,
  getRefundedQuantity,
  refundInvoice,
  type InvoiceDetail,
} from '@/hooks/use-invoices';
import { FormField, inputClassName } from '@/components/form-field';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

interface InvoiceRefundModalProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceRefundModal({
  invoiceId,
  isOpen,
  onClose,
  onSuccess,
}: InvoiceRefundModalProps) {
  const { t } = useTranslation();
  const { formatMoney } = useFormat();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen || !invoiceId) {
      setInvoice(null);
      setQuantities({});
      setReason('');
      setError('');
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError('');

    getInvoice(invoiceId)
      .then((detail) => {
        if (cancelled) return;
        setInvoice(detail);
        const initial: Record<string, number> = {};
        for (const item of detail.items) {
          initial[item.product_id] = 0;
        }
        setQuantities(initial);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('invoices.error.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, invoiceId, t]);

  const lines = useMemo(() => {
    if (!invoice) return [];
    return invoice.items.map((item) => {
      const refunded = getRefundedQuantity(invoice, item.product_id);
      const remaining = Math.max(0, item.quantity - refunded);
      return { ...item, refunded, remaining };
    });
  }, [invoice]);

  const refundTotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const qty = quantities[line.product_id] ?? 0;
      return sum + qty * line.unit_price;
    }, 0);
  }, [lines, quantities]);

  const selectedItems = useMemo(() => {
    return lines
      .filter((line) => (quantities[line.product_id] ?? 0) > 0)
      .map((line) => ({
        productId: line.product_id,
        quantity: quantities[line.product_id] ?? 0,
      }));
  }, [lines, quantities]);

  const handleSubmit = async () => {
    if (!invoiceId || selectedItems.length === 0) {
      setError(t('invoices.refund.noItems'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await refundInvoice(invoiceId, selectedItems, reason);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invoices.error.refundFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('invoices.refund.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-secondary"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="animate-spin" size={18} />
            {t('common.loading')}
          </div>
        ) : invoice ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {invoice.invoice_number ?? `#${invoice.id.slice(-8)}`}
            </p>

            {error && <p className="text-destructive text-sm mb-4">{error}</p>}

            <div className="space-y-3 mb-4">
              {lines.map((line) => (
                <div
                  key={line.product_id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {line.product_name ?? line.product_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('invoices.refund.remaining', {
                        remaining: line.remaining,
                        refunded: line.refunded,
                      })}{' '}
                      · {formatMoney(line.unit_price)}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={line.remaining}
                    step={1}
                    value={quantities[line.product_id] ?? 0}
                    disabled={line.remaining <= 0}
                    onChange={(e) => {
                      const value = Math.min(
                        line.remaining,
                        Math.max(0, parseFloat(e.target.value) || 0),
                      );
                      setQuantities((prev) => ({ ...prev, [line.product_id]: value }));
                    }}
                    className={`${inputClassName} w-20 text-center`}
                  />
                </div>
              ))}
            </div>

            <FormField label={t('invoices.refund.reason')} htmlFor="refund-reason">
              <input
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={inputClassName}
                placeholder={t('invoices.refund.reasonPlaceholder')}
              />
            </FormField>

            <div className="flex justify-between items-center mt-4 p-3 rounded-lg bg-secondary/50">
              <span className="text-sm font-medium">{t('invoices.refund.total')}</span>
              <span className="font-bold">{formatMoney(refundTotal)}</span>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || selectedItems.length === 0}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    {t('common.processing')}
                  </>
                ) : (
                  t('invoices.refund.submit')
                )}
              </button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8">{error || t('invoices.error.loadFailed')}</p>
        )}
      </div>
    </div>
  );
}
