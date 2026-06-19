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
  Receipt,
  Printer,
} from 'lucide-react';
import {
  createInvoice,
  customerToReceiptCustomer,
  invoiceToReceiptData,
  mapPaymentMethod,
  type CreateInvoiceItem,
  type InvoiceDetail,
} from '@/hooks/use-invoices';
import type { CustomerItem } from '@/hooks/use-customers';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';
import { printReceipt } from '@/lib/print-receipt';

interface PaymentModalProps {
  total: number;
  discount: number;
  discountAmount?: number;
  taxPercent?: number;
  items: CreateInvoiceItem[];
  customerId?: string;
  customer?: CustomerItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  notes?: string;
}

type PaymentMethod = 'cash' | 'transfer';

const QUICK_AMOUNTS = [0, 10000, 50000, 100000, 200000, 500000];

export function PaymentModal({
  total,
  discount,
  discountAmount = 0,
  taxPercent = 0,
  items,
  customerId,
  customer,
  isOpen,
  onClose,
  onSuccess,
  storeName,
  storeAddress,
  storePhone,
  notes,
}: PaymentModalProps) {
  const { t } = useTranslation();
  const { formatMoney } = useFormat();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState(total);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [paidTotal, setPaidTotal] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  const [createdInvoice, setCreatedInvoice] = useState<InvoiceDetail | null>(null);
  const [lastAmountPaid, setLastAmountPaid] = useState(0);

  const paymentMethods = useMemo(
    () =>
      [
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
          storeName,
          storeAddress,
          storePhone,
          customer: customer ? customerToReceiptCustomer(customer) : undefined,
          notes,
          amountPaid: paymentMethod === 'cash' ? lastAmountPaid : createdInvoice.total,
          change: changeAmount,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pos.payment.printFailed'));
    }
  };

  const handlePayment = async () => {
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
        customerId,
        discountPercent: discount > 0 ? discount : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        taxPercent: taxPercent > 0 ? taxPercent : undefined,
        paymentMethod: mapPaymentMethod(paymentMethod),
      });

      setCreatedInvoice(invoice);
      setPaidTotal(total);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('pos.payment.close')}
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
        {step === 'success' ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('pos.payment.success')}</h2>
            <p className="text-muted-foreground mb-6">{t('pos.payment.successDesc')}</p>

            <div className="rounded-xl bg-green-50 border border-green-200 p-6 mb-4">
              <p className="text-sm text-green-800 mb-1">{t('pos.payment.total')}</p>
              <p className="text-3xl font-bold text-green-700">{formatMoney(paidTotal)}</p>
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
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{t('pos.payment.title')}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t('pos.payment.productCount', { count: items.length })}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[calc(90vh-180px)] overflow-y-auto">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">{t('pos.payment.total')}</p>
                <p className="text-4xl font-bold text-primary tracking-tight">
                  {formatMoney(total)}
                </p>
                {discount > 0 && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {t('pos.payment.discount', { percent: discount })}
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">{t('pos.payment.method')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === id
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-secondary/50'
                      }`}
                    >
                      <Icon size={22} strokeWidth={paymentMethod === id ? 2.5 : 2} />
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">{t('pos.payment.amountPaid')}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAmountPaid(Math.max(0, amountPaid - 10000))}
                      className="p-2.5 border border-border rounded-xl hover:bg-secondary transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      id="payment-amount-paid"
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="flex-1 px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground text-xl font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setAmountPaid(amountPaid + 10000)}
                      className="p-2.5 border border-border rounded-xl hover:bg-secondary transition-colors"
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
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
                      >
                        {extra === 0 ? t('pos.payment.exactAmount') : `+${formatMoney(extra)}`}
                      </button>
                    ))}
                  </div>

                  {change > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
                      <span className="text-sm font-medium text-green-800">{t('pos.payment.change')}</span>
                      <span className="text-xl font-bold text-green-700">{formatMoney(change)}</span>
                    </div>
                  )}
                  {amountPaid < total && amountPaid > 0 && (
                    <p className="text-xs text-destructive">
                      {t('pos.payment.shortfall', { amount: formatMoney(total - amountPaid) })}
                    </p>
                  )}
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="rounded-xl bg-secondary/60 border border-border p-4 text-sm text-muted-foreground">
                  {t('pos.payment.transferConfirm', { amount: formatMoney(total) })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-secondary/30 flex gap-3">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 border border-border rounded-xl font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handlePayment}
                disabled={!isValidPayment || isProcessing || items.length === 0}
                className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {t('common.processing')}
                  </>
                ) : (
                  t('pos.payment.pay', { amount: formatMoney(total) })
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
