'use client';

import { useState } from 'react';
import { Truck, Plus, Search, Edit2, History, Ban, CheckCircle, Loader2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import {
  activateSupplier,
  createSupplier,
  disableSupplier,
  updateSupplier,
  useSupplierHistory,
  useSuppliers,
  type SupplierItem,
} from '@/hooks/use-suppliers';
import {
  downloadSuppliersExport,
  downloadSuppliersTemplate,
} from '@/hooks/use-import-export';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';
import { SupplierImportModal } from '@/components/supplier-import-modal';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

const emptyForm = { name: '', phone: '', email: '', address: '', tax_code: '' };

export default function SuppliersPage() {
  const { t } = useTranslation();
  const { formatMoney, formatDateTime, getPartyStatusLabel } = useFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SupplierItem | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const { suppliers, total, isLoading, error, mutate } = useSuppliers(
    searchTerm || undefined,
    statusFilter,
  );
  const { history, isLoading: historyLoading } = useSupplierHistory(historyId);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (supplier: SupplierItem) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      tax_code: supplier.tax_code ?? '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError(t('suppliers.error.requiredFields'));
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        tax_code: form.tax_code.trim() || undefined,
      };
      if (editing) {
        await updateSupplier(editing.id, payload);
      } else {
        await createSupplier(payload);
      }
      await mutate();
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('suppliers.error.actionFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async (supplier: SupplierItem) => {
    if (!confirm(t('suppliers.confirm.disable', { name: supplier.name }))) return;
    try {
      await disableSupplier(supplier.id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('suppliers.error.disableFailed'));
    }
  };

  const handleActivate = async (supplier: SupplierItem) => {
    if (!confirm(t('suppliers.confirm.activate', { name: supplier.name }))) return;
    try {
      await activateSupplier(supplier.id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('suppliers.error.activateFailed'));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadSuppliersExport({
        search: searchTerm || undefined,
        status: statusFilter,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : t('importExport.error.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsExporting(true);
    try {
      await downloadSuppliersTemplate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('importExport.error.templateFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('suppliers.title')}</h1>
          <p className="text-muted-foreground">{t('suppliers.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors"
          >
            <Upload size={18} />
            {t('importExport.importCsv')}
          </button>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet size={18} />
            {t('importExport.downloadTemplate')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {t('importExport.exportCsv')}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
          >
            <Plus size={20} />
            {t('suppliers.add')}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <FormField label={t('common.search')} htmlFor="supplier-search">
              <div className="flex items-center gap-2">
                <Search size={20} className="text-muted-foreground shrink-0" />
                <input
                  id="supplier-search"
                  type="text"
                  placeholder={t('suppliers.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClassName} flex-1`}
                />
              </div>
            </FormField>
          </div>
          <div className="md:w-48">
            <FormField label={t('common.status')} htmlFor="supplier-status">
              <select
                id="supplier-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClassName}
              >
                <option value="all">{t('suppliers.filter.all')}</option>
                <option value="ACTIVE">{t('suppliers.filter.active')}</option>
                <option value="DISABLED">{t('suppliers.filter.disabled')}</option>
              </select>
            </FormField>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            {t('common.loading')}
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">{t('suppliers.error.loadFailed')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('suppliers.table.supplier')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('suppliers.table.contact')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('suppliers.table.taxCode')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('suppliers.table.status')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">{t('suppliers.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      {t('suppliers.empty.noSuppliers', { total })}
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Truck size={18} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            {supplier.address && (
                              <p className="text-xs text-muted-foreground">{supplier.address}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p>{supplier.phone}</p>
                        {supplier.email && (
                          <p className="text-muted-foreground">{supplier.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {supplier.tax_code || t('common.none')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            supplier.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getPartyStatusLabel(supplier.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setHistoryId(supplier.id)}
                            className="p-2 hover:bg-secondary rounded-lg text-primary"
                            title={t('suppliers.tooltip.history')}
                          >
                            <History size={16} />
                          </button>
                          {supplier.status === 'ACTIVE' ? (
                            <>
                              <button
                                onClick={() => openEdit(supplier)}
                                className="p-2 hover:bg-secondary rounded-lg"
                                title={t('suppliers.tooltip.edit')}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDisable(supplier)}
                                className="p-2 hover:bg-secondary rounded-lg text-destructive"
                                title={t('suppliers.tooltip.disable')}
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleActivate(supplier)}
                              className="p-2 hover:bg-secondary rounded-lg text-green-600"
                              title={t('suppliers.tooltip.activate')}
                            >
                              <CheckCircle size={16} />
                            </button>
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
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editing ? t('suppliers.modal.edit') : t('suppliers.modal.add')}
            </h2>
            {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}
            <div className="space-y-4 mb-6">
              <FormField label={t('suppliers.form.name')} htmlFor="supplier-name" required>
                <input
                  id="supplier-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('suppliers.form.phone')} htmlFor="supplier-phone" required>
                <input
                  id="supplier-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('suppliers.form.email')} htmlFor="supplier-email">
                <input
                  id="supplier-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('suppliers.form.address')} htmlFor="supplier-address">
                <input
                  id="supplier-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('suppliers.form.taxCode')} htmlFor="supplier-tax">
                <input
                  id="supplier-tax"
                  value={form.tax_code}
                  onChange={(e) => setForm({ ...form, tax_code: e.target.value })}
                  className={inputClassName}
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
                {isSubmitting ? t('common.saving') : editing ? t('common.update') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">{t('suppliers.history.title')}</h2>
            {historyLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="animate-spin" size={18} />
                {t('common.loading')}
              </div>
            ) : history ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('suppliers.history.orderCount')}</span>
                  <span className="font-semibold">{history.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('suppliers.history.totalAmount')}</span>
                  <span className="font-semibold">{formatMoney(history.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('suppliers.history.lastOrder')}</span>
                  <span className="font-semibold">
                    {formatDateTime(history.last_order_at ?? undefined)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">{t('suppliers.history.noData')}</p>
            )}
            <button
              onClick={() => setHistoryId(null)}
              className="w-full mt-6 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      <SupplierImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
