'use client';

import { useEffect, useState } from 'react';
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
  invoiceToReceiptData,
  mapPaymentMethod,
  type CreateInvoiceItem,
  type InvoiceDetail,
} from '@/hooks/use-invoices';
import { formatMoney } from '@/lib/format';
import { printReceipt } from '@/lib/print-receipt';

interface PaymentModalProps {
  total: number;
  discount: number;
  items: CreateInvoiceItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeName?: string;
  notes?: string;
}

type PaymentMethod = 'cash' | 'transfer';

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}[] = [
  { id: 'cash', label: 'Tiền mặt', icon: Banknote },
  { id: 'transfer', label: 'Chuyển khoản', icon: Building2 },
];

const QUICK_AMOUNTS = [0, 10000, 50000, 100000, 200000, 500000];

export function PaymentModal({
  total,
  discount,
  items,
  isOpen,
  onClose,
  onSuccess,
  storeName,
  notes,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState(total);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [paidTotal, setPaidTotal] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  const [createdInvoice, setCreatedInvoice] = useState<InvoiceDetail | null>(null);
  const [lastAmountPaid, setLastAmountPaid] = useState(0);

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
          notes,
          amountPaid: paymentMethod === 'cash' ? lastAmountPaid : createdInvoice.total,
          change: changeAmount,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể in hóa đơn');
    }
  };

  const handlePayment = async () => {
    if (!isValidPayment) {
      setError('Số tiền khách trả phải lớn hơn hoặc bằng tổng tiền');
      return;
    }

    if (items.length === 0) {
      setError('Giỏ hàng trống');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const invoice = await createInvoice({
        items,
        discount: discount > 0 ? discount : undefined,
        paymentMethod: mapPaymentMethod(paymentMethod),
      });

      setCreatedInvoice(invoice);
      setPaidTotal(total);
      setLastAmountPaid(amountPaid);
      setChangeAmount(paymentMethod === 'cash' ? Math.max(0, change) : 0);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thanh toán thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
        {step === 'success' ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Thanh toán thành công!</h2>
            <p className="text-muted-foreground mb-6">Hóa đơn đã được tạo và ghi nhận doanh thu.</p>

            <div className="rounded-xl bg-green-50 border border-green-200 p-6 mb-4">
              <p className="text-sm text-green-800 mb-1">Tổng thanh toán</p>
              <p className="text-3xl font-bold text-green-700">{formatMoney(paidTotal)}</p>
            </div>

            {changeAmount > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
                <p className="text-sm text-amber-800">Tiền thừa trả khách</p>
                <p className="text-xl font-bold text-amber-900">{formatMoney(changeAmount)}</p>
              </div>
            )}

            {createdInvoice?.invoice_number && (
              <p className="text-sm text-muted-foreground mb-4">
                Mã hóa đơn: <span className="font-semibold text-foreground">{createdInvoice.invoice_number}</span>
              </p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-xl font-semibold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
              >
                <Printer size={20} />
                In hóa đơn
              </button>
              <button
                onClick={handleDone}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Đơn mới
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
                  <h2 className="text-xl font-bold text-foreground">Thanh toán</h2>
                  <p className="text-xs text-muted-foreground">{items.length} sản phẩm</p>
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
                <p className="text-sm text-muted-foreground mb-1">Tổng thanh toán</p>
                <p className="text-4xl font-bold text-primary tracking-tight">
                  {formatMoney(total)}
                </p>
                {discount > 0 && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    Giảm giá {discount}%
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Phương thức thanh toán</p>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
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
                  <p className="text-sm font-semibold text-foreground">Khách trả</p>
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
                        {extra === 0 ? 'Đúng tiền' : `+${formatMoney(extra)}`}
                      </button>
                    ))}
                  </div>

                  {change > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
                      <span className="text-sm font-medium text-green-800">Tiền thừa</span>
                      <span className="text-xl font-bold text-green-700">{formatMoney(change)}</span>
                    </div>
                  )}
                  {amountPaid < total && amountPaid > 0 && (
                    <p className="text-xs text-destructive">
                      Còn thiếu {formatMoney(total - amountPaid)}
                    </p>
                  )}
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="rounded-xl bg-secondary/60 border border-border p-4 text-sm text-muted-foreground">
                  Xác nhận khách đã chuyển khoản <strong className="text-foreground">{formatMoney(total)}</strong> trước khi hoàn tất.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-secondary/30 flex gap-3">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 border border-border rounded-xl font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handlePayment}
                disabled={!isValidPayment || isProcessing || items.length === 0}
                className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Đang xử lý...
                  </>
                ) : (
                  `Thanh toán ${formatMoney(total)}`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
