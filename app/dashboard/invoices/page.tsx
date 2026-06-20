'use client';

import { Download, FileText, Loader2, Printer, RotateCcw, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { InvoiceRefundModal } from '@/components/invoice-refund-modal';
import { FormField, inputClassName } from '@/components/form-field';
import { PaginationBar } from '@/components/pagination-bar';
import {
  cancelInvoice,
  customerToReceiptCustomer,
  getInvoice,
  invoiceToReceiptData,
  useInvoices,
} from '@/hooks/use-invoices';
import { downloadInvoicesExport } from '@/hooks/use-import-export';
import { isFeatureEnabled, useSettings } from '@/hooks/use-settings';
import { useTenant } from '@/hooks/use-tenant';
import { useAuthStore } from '@/lib/auth-store';
import { getDateRange } from '@/lib/format';
import { printReceipt } from '@/lib/print-receipt';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

export default function InvoicesPage() {
  const { t } = useTranslation();
  const { formatMoney, formatDateTime } = useFormat();
  const { from, to } = useMemo(() => getDateRange('month'), []);
  const [page, setPage] = useState(1);
  const { invoices, total, pagination, isLoading, error, mutate } = useInvoices(from, to, {
    page,
  });
  const { featureFlags } = useSettings();
  const { tenant } = useTenant();
  const user = useAuthStore((state) => state.user);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [refundTargetId, setRefundTargetId] = useState<string | null>(null);

  const refundEnabled = isFeatureEnabled(featureFlags, 'enable_refund');

  const storeAddress = [tenant?.address, tenant?.city, tenant?.state]
    .filter(Boolean)
    .join(', ');

  const handlePrint = async (invoiceId: string) => {
    setPrintingId(invoiceId);
    try {
      const detail = await getInvoice(invoiceId);
      printReceipt(
        invoiceToReceiptData(detail, {
          storeName: user?.tenantName ?? tenant?.name,
          storeAddress: storeAddress || undefined,
          storePhone: tenant?.phone || undefined,
          customer: detail.customer ? customerToReceiptCustomer(detail.customer) : undefined,
        }),
      );
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

  const openCancel = (invoiceId: string) => {
    setCancelTargetId(invoiceId);
    setCancelReason('');
    setCancelError('');
  };

  const handleCancel = async () => {
    if (!cancelTargetId) return;
    setIsCancelling(true);
    setCancelError('');
    try {
      await cancelInvoice(cancelTargetId, cancelReason);
      await mutate();
      setCancelTargetId(null);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : t('invoices.error.cancelFailed'));
    } finally {
      setIsCancelling(false);
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
                              : inv.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : inv.status === 'REFUNDED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handlePrint(inv.id)}
                            disabled={printingId === inv.id}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 disabled:opacity-50"
                            title={t('invoices.printTitle')}
                          >
                            {printingId === inv.id ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <Printer size={14} />
                            )}
                          </button>
                          {inv.status === 'PAID' && (
                            <>
                              <button
                                type="button"
                                onClick={() => openCancel(inv.id)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15"
                                title={t('invoices.cancel.title')}
                              >
                                <XCircle size={14} />
                              </button>
                              {refundEnabled && (
                                <button
                                  type="button"
                                  onClick={() => setRefundTargetId(inv.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15"
                                  title={t('invoices.refund.title')}
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar pagination={pagination} onPageChange={setPage} isLoading={isLoading} />
      </div>

      {cancelTargetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-2">{t('invoices.cancel.title')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('invoices.cancel.description')}</p>
            {cancelError && <p className="text-destructive text-sm mb-4">{cancelError}</p>}
            <FormField label={t('invoices.cancel.reason')} htmlFor="cancel-reason">
              <input
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className={inputClassName}
                placeholder={t('invoices.cancel.reasonPlaceholder')}
              />
            </FormField>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCancelTargetId(null)}
                disabled={isCancelling}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    {t('common.processing')}
                  </>
                ) : (
                  t('invoices.cancel.submit')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <InvoiceRefundModal
        invoiceId={refundTargetId}
        isOpen={Boolean(refundTargetId)}
        onClose={() => setRefundTargetId(null)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
