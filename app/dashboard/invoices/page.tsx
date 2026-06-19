'use client';

import { Download, FileText, Loader2, Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getInvoice, invoiceToReceiptData, useInvoices } from '@/hooks/use-invoices';
import { downloadInvoicesExport } from '@/hooks/use-import-export';
import { useAuthStore } from '@/lib/auth-store';
import { getDateRange } from '@/lib/format';
import { printReceipt } from '@/lib/print-receipt';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

export default function InvoicesPage() {
  const { t } = useTranslation();
  const { formatMoney, formatDateTime } = useFormat();
  const { from, to } = useMemo(() => getDateRange('month'), []);
  const { invoices, total, isLoading, error } = useInvoices(from, to, 50);
  const user = useAuthStore((state) => state.user);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = async (invoiceId: string) => {
    setPrintingId(invoiceId);
    try {
      const detail = await getInvoice(invoiceId);
      printReceipt(invoiceToReceiptData(detail, { storeName: user?.tenantName }));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('invoices.error.printFailed'));
    } finally {
      setPrintingId(null);
    }
  };

  const handleExport = async (exportType: 'summary' | 'detail') => {
    setIsExporting(true);
    try {
      await downloadInvoicesExport({ from, to, export_type: exportType });
    } catch (err) {
      alert(err instanceof Error ? err.message : t('importExport.error.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('invoices.title')}</h1>
          <p className="text-muted-foreground">{t('invoices.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('summary')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {t('importExport.exportSummary')}
          </button>
          <button
            type="button"
            onClick={() => handleExport('detail')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {t('importExport.exportDetail')}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <p className="text-sm text-muted-foreground">
          {t('invoices.totalCount', { count: total })}
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            {t('common.loading')}
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">{t('invoices.error.loadFailed')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('invoices.table.invoiceCode')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('invoices.table.date')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('invoices.table.payment')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">{t('invoices.table.total')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">{t('invoices.table.status')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">{t('invoices.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <FileText className="mx-auto mb-2 opacity-50" size={32} />
                      {t('invoices.empty.noInvoices')}
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
                      <td className="px-6 py-4 text-sm">{inv.payment_method ?? t('common.none')}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatMoney(inv.total)}
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
                          title={t('invoices.printTitle')}
                        >
                          {printingId === inv.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Printer size={16} />
                          )}
                          {t('invoices.print')}
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
