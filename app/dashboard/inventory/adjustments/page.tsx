'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal, Plus, Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/use-inventory';
import {
  createAdjustment,
  useInventoryTransactions,
  type AdjustmentReason,
} from '@/hooks/use-inventory-adjustments';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

const REASONS: AdjustmentReason[] = ['DAMAGE', 'LOSS', 'EXPIRED', 'CORRECTION'];

export default function InventoryAdjustmentsPage() {
  const { t } = useTranslation();
  const { formatDateTime, getAdjustmentReasonLabel, getTransactionTypeLabel } = useFormat();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    reason: 'CORRECTION' as AdjustmentReason,
    note: '',
  });

  const { products } = useProducts(undefined, { limit: 200 });
  const { transactions, total, isLoading, error, mutate } = useInventoryTransactions('ADJUST');

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p.name])),
    [products],
  );

  const handleSubmit = async () => {
    const quantity = Number(form.quantity);
    if (!form.productId) {
      setFormError(t('adjustments.error.productRequired'));
      return;
    }
    if (!quantity || quantity === 0) {
      setFormError(t('adjustments.error.quantityInvalid'));
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await createAdjustment({
        productId: form.productId,
        quantity,
        reason: form.reason,
        note: form.note.trim() || undefined,
      });
      await mutate();
      setShowModal(false);
      setForm({ productId: '', quantity: '', reason: 'CORRECTION', note: '' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('adjustments.error.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('adjustments.title')}</h1>
          <p className="text-muted-foreground">{t('adjustments.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          <Plus size={20} />
          {t('adjustments.create')}
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            {t('common.loading')}
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">{t('adjustments.error.loadFailed')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('adjustments.table.time')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('adjustments.table.product')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('adjustments.table.type')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">{t('adjustments.table.quantity')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">{t('adjustments.table.balanceAfter')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('adjustments.table.note')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      {t('adjustments.empty.noAdjustments', { total })}
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {productMap.get(tx.productId) ?? tx.productId.slice(-6)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getTransactionTypeLabel(tx.type)}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm text-right font-semibold ${
                          tx.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.quantity > 0 ? '+' : ''}
                        {tx.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">{tx.balance_after}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                        {tx.note || t('common.none')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={22} className="text-primary" />
              <h2 className="text-xl font-bold">{t('adjustments.modal.title')}</h2>
            </div>
            {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}
            <div className="space-y-4 mb-6">
              <FormField label={t('adjustments.form.product')} htmlFor="adj-product" required>
                <select
                  id="adj-product"
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">{t('adjustments.placeholders.productSelect')}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {t('adjustments.placeholders.stockInOption', { stock: p.stock })}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                label={t('adjustments.form.quantity')}
                htmlFor="adj-quantity"
                required
                hint={t('adjustments.form.quantityHint')}
              >
                <input
                  id="adj-quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className={inputClassName}
                  placeholder={t('adjustments.placeholders.quantity')}
                />
              </FormField>
              <FormField label={t('adjustments.form.reason')} htmlFor="adj-reason" required>
                <select
                  id="adj-reason"
                  value={form.reason}
                  onChange={(e) =>
                    setForm({ ...form, reason: e.target.value as AdjustmentReason })
                  }
                  className={selectClassName}
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {getAdjustmentReasonLabel(r)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t('adjustments.form.note')} htmlFor="adj-note">
                <input
                  id="adj-note"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className={inputClassName}
                  placeholder={t('adjustments.placeholders.note')}
                />
              </FormField>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {isSubmitting ? t('common.processing') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
