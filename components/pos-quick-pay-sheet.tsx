'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Banknote,
  Building2,
  Plus,
  Minus,
  CheckCircle2,
  Loader2,
  Printer,
} from 'lucide-react';
import {
  createInvoice,
  invoiceToReceiptData,
  mapPaymentMethod,
  type CreateInvoiceItem,
  type InvoiceDetail,
} from '@/hooks/use-invoices';
import { cartItemsToInvoiceItems } from '@/lib/pos-utils';
import { useReceiptLayout } from '@/hooks/use-receipt-layout';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';
import { printReceipt } from '@/lib/print-receipt';

interface PosQuickPaySheetProps {
  total: number;
  items: CreateInvoiceItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'cash' | 'transfer';

const QUICK_AMOUNTS = [0, 10000, 50000, 100000, 200000, 500000];

export function PosQuickPaySheet({
  total,
  items,
  isOpen,
  onClose,
  onSuccess,
}: PosQuickPaySheetProps) {
  const { t } = useTranslation();
  const { formatMoney } = useFormat();
  const { storeInfo } = useReceiptLayout();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState(total);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [changeAmount, setChangeAmount] = useState(0);
  const [createdInvoice, setCreatedInvoice] = useState<InvoiceDetail | null>(null);
  const [lastAmountPaid, setLastAmountPaid] = useState(0);

  const paymentMethods = useMemo(
    () => [
      { id: 'cash' as const, label: t('pos.payment.cash'), icon: Banknote },
      { id: 'transfer' as const, label: t('pos.payment.transfer'), icon: Building2 },
    ],
    [t],
  );

  useEffect(() => {
    if (isOpen) {
      setAmountPaid(total);
      setError('');
      setStep('form');
      setPaymentMethod('cash');
      setCreatedInvoice(null);
    }
  }, [isOpen, total]);

  const change = amountPaid - total;
  const isValidPayment = paymentMethod !== 'cash' || amountPaid >= total;

  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  const handlePrint = () => {
    if (!createdInvoice) return;
    try {
      printReceipt(
        invoiceToReceiptData(createdInvoice, {
          ...storeInfo,
          amountPaid: paymentMethod === 'cash' ? lastAmountPaid : createdInvoice.total,
          change: changeAmount,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pos.payment.printFailed'));
    }
  };

  const handleConfirm = async () => {
    if (!isValidPayment) {
      setError(t('pos.payment.insufficientPaid'));
      return;
    }
    if (items.length === 0) {
      setError(t('pos.payment.emptyCart'));
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const invoice = await createInvoice({
        items,
        paymentMethod: mapPaymentMethod(paymentMethod),
      });

      setCreatedInvoice(invoice);
      setLastAmountPaid(amountPaid);
      setChangeAmount(paymentMethod === 'cash' ? Math.max(0, change) : 0);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pos.payment.failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('pos.payment.close')}
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
        {step === 'success' ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('pos.payment.success')}</h2>
            <p className="text-muted-foreground mb-6">{t('pos.retail.successDesc')}</p>

            <div className="rounded-xl bg-green-50 border border-green-200 p-6 mb-4">
              <p className="text-sm text-green-800 mb-1">{t('pos.payment.total')}</p>
              <p className="text-3xl font-bold text-green-700">{formatMoney(total)}</p>
            </div>

            {changeAmount > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
                <p className="text-sm text-amber-800">{t('pos.payment.changeToCustomer')}</p>
                <p className="text-xl font-bold text-amber-900">{formatMoney(changeAmount)}</p>
              </div>
            )}

            {createdInvoice?.invoice_number && (
              <p className="text-sm text-muted-foreground mb-4">
                {t('pos.payment.invoiceCode')}{' '}
                <span className="font-semibold text-foreground">{createdInvoice.invoice_number}</span>
              </p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl font-semibold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
              >
                <Printer size={20} />
                {t('pos.payment.print')}
              </button>
              <button
                onClick={handleDone}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                {t('pos.payment.newOrder')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold">{t('pos.retail.confirmTitle')}</h2>
              <button type="button" onClick={handleClose} disabled={isProcessing} className="p-2 hover:bg-secondary rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  {error}
                </p>
              )}

              <div className="rounded-2xl bg-primary/10 border border-primary/20 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">{t('pos.payment.total')}</p>
                <p className="text-4xl font-bold text-primary">{formatMoney(total)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      paymentMethod === id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">{t('pos.payment.amountPaid')}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAmountPaid(Math.max(0, amountPaid - 10000))}
                      className="p-2.5 border border-border rounded-xl hover:bg-secondary"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="flex-1 px-4 py-3 border border-input rounded-xl text-xl font-bold text-center bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setAmountPaid(amountPaid + 10000)}
                      className="p-2.5 border border-border rounded-xl hover:bg-secondary"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((extra) => (
                      <button
                        key={extra}
                        type="button"
                        onClick={() => setAmountPaid(extra === 0 ? total : amountPaid + extra)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-primary/10"
                      >
                        {extra === 0 ? t('pos.payment.exactAmount') : `+${formatMoney(extra)}`}
                      </button>
                    ))}
                  </div>
                  {change > 0 && (
                    <div className="flex justify-between p-3 rounded-xl bg-green-50 border border-green-200 text-green-800">
                      <span>{t('pos.payment.change')}</span>
                      <span className="font-bold">{formatMoney(change)}</span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <p className="text-sm text-muted-foreground rounded-xl bg-secondary/60 p-4">
                  {t('pos.payment.transferConfirm', { amount: formatMoney(total) })}
                </p>
              )}
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 py-3 border border-border rounded-xl font-semibold hover:bg-secondary disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValidPayment || isProcessing || items.length === 0}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {t('common.processing')}
                  </>
                ) : (
                  t('pos.retail.confirmPay')
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
