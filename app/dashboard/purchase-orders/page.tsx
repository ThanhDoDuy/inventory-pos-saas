'use client';

import { useMemo, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Eye,
  CheckCircle,
  PackageCheck,
  XCircle,
  Loader2,
  Upload,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { useProducts } from '@/hooks/use-inventory';
import { useSuppliers } from '@/hooks/use-suppliers';
import {
  approvePurchaseOrder,
  cancelPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  usePurchaseOrder,
  usePurchaseOrders,
  type PurchaseOrder,
} from '@/hooks/use-purchase-orders';
import { getPoStatusColor } from '@/lib/format';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';
import { PurchaseOrderImportModal } from '@/components/purchase-order-import-modal';
import { ImportExportDropdown } from '@/components/import-export-dropdown';
import { downloadPurchaseOrdersExport, downloadPurchaseOrdersTemplate } from '@/hooks/use-import-export';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface LineItem {
  productId: string;
  quantity: string;
  costPrice: string;
}

const emptyLine = (): LineItem => ({ productId: '', quantity: '1', costPrice: '0' });

const PO_STATUSES = ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] as const;

export default function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const { formatMoney, formatDateTime, getPoStatusLabel } = useFormat();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    supplierId: '',
    expectedDate: '',
    items: [emptyLine()],
  });

  const { orders, total, isLoading, error, mutate } = usePurchaseOrders(statusFilter);
  const { order: detail, isLoading: detailLoading, mutate: mutateDetail } = usePurchaseOrder(detailId);
  const { suppliers } = useSuppliers(undefined, 'ACTIVE');
  const { products } = useProducts(undefined, { limit: 200 });

  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s.name])),
    [suppliers],
  );
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p.name])),
    [products],
  );

  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({});

  const openDetail = (id: string) => {
    setDetailId(id);
    setReceiveQty({});
    setFormError('');
  };

  const handleCreate = async () => {
    if (!createForm.supplierId) {
      setFormError(t('purchaseOrders.error.supplierRequired'));
      return;
    }
    const items = createForm.items
      .filter((i) => i.productId)
      .map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        costPrice: Number(i.costPrice),
      }));
    if (items.length === 0) {
      setFormError(t('purchaseOrders.error.itemsRequired'));
      return;
    }
    if (items.some((i) => !i.quantity || i.quantity < 1)) {
      setFormError(t('purchaseOrders.error.quantityMin'));
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await createPurchaseOrder({
        supplierId: createForm.supplierId,
        items,
        expectedDate: createForm.expectedDate || undefined,
      });
      await mutate();
      setShowCreate(false);
      setCreateForm({ supplierId: '', expectedDate: '', items: [emptyLine()] });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('purchaseOrders.error.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    setIsSubmitting(true);
    try {
      await approvePurchaseOrder(id);
      await mutate();
      await mutateDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('purchaseOrders.error.approveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestApprove = (id: string) => {
    setApproveId(id);
  };

  const confirmApprove = async () => {
    if (!approveId) return;
    await handleApprove(approveId);
    setApproveId(null);
  };

  const handleReceive = async (order: PurchaseOrder) => {
    const items = (order.items ?? [])
      .filter((i) => i.remaining_quantity > 0)
      .map((i) => ({
        productId: i.productId,
        receivedQuantity: Number(receiveQty[i.productId] ?? i.remaining_quantity),
      }))
      .filter((i) => i.receivedQuantity > 0);

    if (items.length === 0) {
      setFormError(t('purchaseOrders.error.receiveQtyRequired'));
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await receivePurchaseOrder(order.id, items);
      await mutate();
      await mutateDetail();
      setReceiveQty({});
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('purchaseOrders.error.receiveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt(t('purchaseOrders.prompt.cancelReason'));
    if (!reason?.trim()) return;
    setIsSubmitting(true);
    try {
      await cancelPurchaseOrder(id, reason.trim());
      await mutate();
      await mutateDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('purchaseOrders.error.cancelFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLine = () => {
    setCreateForm((f) => ({ ...f, items: [...f.items, emptyLine()] }));
  };

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setCreateForm((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const removeLine = (index: number) => {
    setCreateForm((f) => ({
      ...f,
      items: f.items.length > 1 ? f.items.filter((_, i) => i !== index) : f.items,
    }));
  };

  const canApprove = detail?.status === 'DRAFT';
  const canReceive =
    detail?.status === 'APPROVED' || detail?.status === 'PARTIALLY_RECEIVED';
  const canCancel =
    detail?.status === 'DRAFT' || detail?.status === 'APPROVED';

  const handleDownloadTemplate = async () => {
    setIsTemplateLoading(true);
    try {
      await downloadPurchaseOrdersTemplate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('importExport.error.templateFailed'));
    } finally {
      setIsTemplateLoading(false);
    }
  };

  const handleExport = async (exportType: 'summary' | 'detail') => {
    setIsExporting(true);
    try {
      await downloadPurchaseOrdersExport({
        status: statusFilter,
        export_type: exportType,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : t('importExport.error.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('purchaseOrders.title')}</h1>
          <p className="text-muted-foreground">{t('purchaseOrders.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportExportDropdown
            label={t('importExport.menu')}
            isBusy={isExporting || isTemplateLoading}
            items={[
              {
                id: 'export-summary',
                label: t('importExport.exportSummary'),
                icon: <Download size={18} />,
                onClick: () => handleExport('summary'),
              },
              {
                id: 'export-detail',
                label: t('importExport.exportDetail'),
                icon: <Download size={18} />,
                onClick: () => handleExport('detail'),
              },
              {
                id: 'download-template',
                label: t('importExport.downloadTemplate'),
                icon: <FileSpreadsheet size={18} />,
                onClick: handleDownloadTemplate,
              },
              {
                id: 'import',
                label: t('importExport.importCsv'),
                icon: <Upload size={18} />,
                onClick: () => setShowImportModal(true),
              },
            ]}
          />
          <button
            onClick={() => {
              setFormError('');
              setShowCreate(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
          >
            <Plus size={20} />
            {t('purchaseOrders.create')}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <FormField label={t('purchaseOrders.filter.status')} htmlFor="po-status">
          <select
            id="po-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${selectClassName} max-w-xs`}
          >
            <option value="all">{t('purchaseOrders.status.all')}</option>
            {PO_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getPoStatusLabel(status)}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            {t('common.loading')}
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">{t('purchaseOrders.error.loadList')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('purchaseOrders.table.poNumber')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('purchaseOrders.table.supplier')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('purchaseOrders.table.status')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">{t('purchaseOrders.table.total')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('purchaseOrders.table.createdAt')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">{t('purchaseOrders.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      {t('purchaseOrders.empty.noOrders', { total })}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-6 py-4 font-medium">{order.po_number}</td>
                      <td className="px-6 py-4 text-sm">
                        {supplierMap.get(order.supplierId) ?? t('common.none')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPoStatusColor(order.status)}`}
                        >
                          {getPoStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        {formatMoney(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetail(order.id)}
                          className="p-2 hover:bg-secondary rounded-lg text-primary"
                          title={t('purchaseOrders.tooltip.detail')}
                        >
                          <Eye size={16} />
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

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg border border-border p-8 max-w-2xl w-full my-8">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={22} className="text-primary" />
              <h2 className="text-xl font-bold">{t('purchaseOrders.modal.create')}</h2>
            </div>
            {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}
            <div className="space-y-4 mb-6">
              <FormField label={t('purchaseOrders.form.supplier')} htmlFor="po-supplier" required>
                <select
                  id="po-supplier"
                  value={createForm.supplierId}
                  onChange={(e) => setCreateForm({ ...createForm, supplierId: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">{t('purchaseOrders.placeholders.supplierSelect')}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t('purchaseOrders.form.expectedDate')} htmlFor="po-expected">
                <input
                  id="po-expected"
                  type="date"
                  value={createForm.expectedDate}
                  onChange={(e) => setCreateForm({ ...createForm, expectedDate: e.target.value })}
                  className={inputClassName}
                />
              </FormField>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t('purchaseOrders.form.products')}</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-sm text-primary hover:underline"
                  >
                    {t('purchaseOrders.addLine')}
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2 mb-2 px-0.5">
                  <div className="col-span-5 text-sm font-medium text-foreground">{t('purchaseOrders.form.products')}</div>
                  <div className="col-span-2 text-sm font-medium text-foreground">{t('purchaseOrders.form.quantity')}</div>
                  <div className="col-span-3 text-sm font-medium text-foreground">{t('purchaseOrders.form.costPrice')}</div>
                  <div className="col-span-2" />
                </div>
                <div className="space-y-3">
                  {createForm.items.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <select
                          value={line.productId}
                          onChange={(e) => updateLine(index, { productId: e.target.value })}
                          className={selectClassName}
                        >
                          <option value="">{t('purchaseOrders.placeholders.productSelect')}</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          placeholder={t('purchaseOrders.placeholders.quantity')}
                          aria-label={t('purchaseOrders.form.quantity')}
                          value={line.quantity}
                          onChange={(e) => updateLine(index, { quantity: e.target.value })}
                          className={inputClassName}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={0}
                          placeholder={t('purchaseOrders.placeholders.costPrice')}
                          aria-label={t('purchaseOrders.form.costPrice')}
                          value={line.costPrice}
                          onChange={(e) => updateLine(index, { costPrice: e.target.value })}
                          className={inputClassName}
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="w-full py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          {t('purchaseOrders.remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {isSubmitting ? t('purchaseOrders.creating') : t('purchaseOrders.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg border border-border p-8 max-w-2xl w-full my-8">
            {detailLoading || !detail ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="animate-spin" size={20} />
                {t('purchaseOrders.detail.loading')}
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{detail.po_number}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {supplierMap.get(detail.supplierId)} ·{' '}
                      {formatDateTime(detail.created_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPoStatusColor(detail.status)}`}
                  >
                    {getPoStatusLabel(detail.status)}
                  </span>
                </div>

                {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}

                <div className="border border-border rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-2 text-left">{t('purchaseOrders.form.products')}</th>
                        <th className="px-4 py-2 text-right">{t('purchaseOrders.detail.orderedQty')}</th>
                        <th className="px-4 py-2 text-right">{t('purchaseOrders.detail.receivedQty')}</th>
                        <th className="px-4 py-2 text-right">{t('purchaseOrders.detail.costPrice')}</th>
                        {canReceive && <th className="px-4 py-2 text-right">{t('purchaseOrders.detail.receiveThisTime')}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.items ?? []).map((item) => (
                        <tr key={item.id} className="border-t border-border">
                          <td className="px-4 py-2">
                            {productMap.get(item.productId) ?? item.productId.slice(-6)}
                          </td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{item.received_quantity}</td>
                          <td className="px-4 py-2 text-right">
                            {formatMoney(item.cost_price)}
                          </td>
                          {canReceive && item.remaining_quantity > 0 && (
                            <td className="px-4 py-2 text-right">
                              <input
                                type="number"
                                min={1}
                                max={item.remaining_quantity}
                                className={`${inputClassName} w-20 text-right`}
                                placeholder={String(item.remaining_quantity)}
                                value={receiveQty[item.productId] ?? ''}
                                onChange={(e) =>
                                  setReceiveQty({ ...receiveQty, [item.productId]: e.target.value })
                                }
                              />
                            </td>
                          )}
                          {canReceive && item.remaining_quantity <= 0 && (
                            <td className="px-4 py-2 text-right text-muted-foreground">{t('common.none')}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-right font-semibold mb-6">
                  {t('purchaseOrders.total', { amount: formatMoney(detail.total_amount) })}
                </p>

                <div className="flex flex-wrap gap-2">
                  {canApprove && (
                    <button
                      onClick={() => requestApprove(detail.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      <CheckCircle size={16} />
                      {t('purchaseOrders.approve')}
                    </button>
                  )}
                  {canReceive && (
                    <button
                      onClick={() => handleReceive(detail)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      <PackageCheck size={16} />
                      {t('purchaseOrders.receive')}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(detail.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      {t('purchaseOrders.cancelOrder')}
                    </button>
                  )}
                  <button
                    onClick={() => setDetailId(null)}
                    className="ml-auto px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={approveId !== null}
        title={t('common.confirm')}
        message={t('purchaseOrders.confirm.approve')}
        cancelText={t('common.cancel')}
        confirmText={t('common.confirm')}
        isLoading={isSubmitting}
        onCancel={() => (isSubmitting ? null : setApproveId(null))}
        onConfirm={confirmApprove}
      />

      <PurchaseOrderImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
