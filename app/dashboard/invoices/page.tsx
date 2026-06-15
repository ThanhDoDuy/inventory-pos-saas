'use client';

import { FileText, Loader2, Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getInvoice, invoiceToReceiptData, useInvoices } from '@/hooks/use-invoices';
import { useAuthStore } from '@/lib/auth-store';
import { formatDateTime, formatPrice, getDateRange } from '@/lib/format';
import { printReceipt } from '@/lib/print-receipt';

export default function InvoicesPage() {
  const { from, to } = useMemo(() => getDateRange('month'), []);
  const { invoices, total, isLoading, error } = useInvoices(from, to, 50);
  const user = useAuthStore((state) => state.user);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const handlePrint = async (invoiceId: string) => {
    setPrintingId(invoiceId);
    try {
      const detail = await getInvoice(invoiceId);
      printReceipt(invoiceToReceiptData(detail, { storeName: user?.tenantName }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể in hóa đơn');
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Hóa đơn</h1>
        <p className="text-muted-foreground">Danh sách hóa đơn bán hàng (30 ngày gần nhất)</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <p className="text-sm text-muted-foreground">
          Tổng: <span className="font-semibold text-foreground">{total}</span> hóa đơn
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            Đang tải...
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">Không tải được hóa đơn</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Mã HĐ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Ngày</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Thanh toán</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Tổng tiền</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <FileText className="mx-auto mb-2 opacity-50" size={32} />
                      Chưa có hóa đơn
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {inv.invoice_number ?? `#${inv.id.slice(-8)}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(inv.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">{inv.payment_method ?? '—'}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatPrice(inv.total)}₫
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            inv.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handlePrint(inv.id)}
                          disabled={printingId === inv.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 disabled:opacity-50"
                          title="In hóa đơn"
                        >
                          {printingId === inv.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Printer size={16} />
                          )}
                          In
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
