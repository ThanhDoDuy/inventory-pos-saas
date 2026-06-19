'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  History,
  Ban,
  CheckCircle,
  Loader2,
  Download,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import {
  activateCustomer,
  createCustomer,
  disableCustomer,
  updateCustomer,
  useCustomerHistory,
  useCustomers,
  type CustomerItem,
  type CustomerType,
} from '@/hooks/use-customers';
import {
  downloadCustomersExport,
  downloadCustomersTemplate,
} from '@/hooks/use-import-export';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';
import { CustomerImportModal } from '@/components/customer-import-modal';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

const emptyForm = {
  customer_type: 'INDIVIDUAL' as CustomerType,
  name: '',
  phone: '',
  email: '',
  address: '',
  tax_code: '',
  contact_person: '',
};

export default function CustomersPage() {
  const { t } = useTranslation();
  const { formatMoney, formatDateTime, getPartyStatusLabel } = useFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomerItem | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const { customers, total, isLoading, error, mutate } = useCustomers(
    searchTerm || undefined,
    statusFilter,
    typeFilter,
  );
  const { history, isLoading: historyLoading } = useCustomerHistory(historyId);

  const getCustomerTypeLabel = (type: CustomerType) => {
    if (type === 'COMPANY') return t('customers.type.company');
    if (type === 'GROUP') return t('customers.type.group');
    return t('customers.type.individual');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (customer: CustomerItem) => {
    setEditing(customer);
    setForm({
      customer_type: customer.customer_type,
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
      address: customer.address ?? '',
      tax_code: customer.tax_code ?? '',
      contact_person: customer.contact_person ?? '',
    });
    setFormError('');
    setShowModal(true);
  };

  const validateForm = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      return t('customers.error.requiredFields');
    }
    if (form.customer_type === 'COMPANY' && !form.tax_code.trim()) {
      return t('customers.error.taxCodeRequired');
    }
    return '';
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        customer_type: form.customer_type,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        tax_code:
          form.customer_type === 'COMPANY' ? form.tax_code.trim() : undefined,
        contact_person: form.contact_person.trim() || undefined,
      };
      if (editing) {
        await updateCustomer(editing.id, payload);
      } else {
        await createCustomer(payload);
      }
      await mutate();
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('customers.error.actionFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async (customer: CustomerItem) => {
    if (!confirm(t('customers.confirm.disable', { name: customer.name }))) return;
    try {
      await disableCustomer(customer.id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('customers.error.disableFailed'));
    }
  };

  const handleActivate = async (customer: CustomerItem) => {
    if (!confirm(t('customers.confirm.activate', { name: customer.name }))) return;
    try {
      await activateCustomer(customer.id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('customers.error.activateFailed'));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadCustomersExport({
        search: searchTerm || undefined,
        status: statusFilter,
        customer_type: typeFilter,
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
      await downloadCustomersTemplate();
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
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('customers.title')}</h1>
          <p className="text-muted-foreground">{t('customers.subtitle')}</p>
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
            {t('customers.add')}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <FormField label={t('common.search')} htmlFor="customer-search">
              <div className="flex items-center gap-2">
                <Search size={20} className="text-muted-foreground shrink-0" />
                <input
                  id="customer-search"
                  type="text"
                  placeholder={t('customers.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClassName} flex-1`}
                />
              </div>
            </FormField>
          </div>
          <div className="md:w-48">
            <FormField label={t('customers.type.label')} htmlFor="customer-type-filter">
              <select
                id="customer-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={selectClassName}
              >
                <option value="all">{t('customers.filter.typeAll')}</option>
                <option value="INDIVIDUAL">{t('customers.filter.typeIndividual')}</option>
                <option value="COMPANY">{t('customers.filter.typeCompany')}</option>
                <option value="GROUP">{t('customers.filter.typeGroup')}</option>
              </select>
            </FormField>
          </div>
          <div className="md:w-48">
            <FormField label={t('common.status')} htmlFor="customer-status">
              <select
                id="customer-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClassName}
              >
                <option value="all">{t('customers.filter.all')}</option>
                <option value="ACTIVE">{t('customers.filter.active')}</option>
                <option value="DISABLED">{t('customers.filter.disabled')}</option>
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
          <p className="text-center py-12 text-destructive">{t('customers.error.loadFailed')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('customers.table.customer')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('customers.table.type')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('customers.table.contact')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('customers.table.status')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('customers.table.lastPurchase')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">{t('customers.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      {t('customers.empty.noCustomers', { total })}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users size={18} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.customer_type === 'COMPANY' && customer.tax_code && (
                              <p className="text-xs text-muted-foreground">
                                {t('customers.form.taxCode')}: {customer.tax_code}
                              </p>
                            )}
                            {customer.contact_person && (
                              <p className="text-xs text-muted-foreground">{customer.contact_person}</p>
                            )}
                            {customer.address && (
                              <p className="text-xs text-muted-foreground">{customer.address}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-secondary">
                          {getCustomerTypeLabel(customer.customer_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p>{customer.phone}</p>
                        {customer.email && (
                          <p className="text-muted-foreground">{customer.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            customer.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getPartyStatusLabel(customer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(customer.last_purchase_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setHistoryId(customer.id)}
                            className="p-2 hover:bg-secondary rounded-lg text-primary"
                            title={t('customers.tooltip.history')}
                          >
                            <History size={16} />
                          </button>
                          {customer.status === 'ACTIVE' ? (
                            <>
                              <button
                                onClick={() => openEdit(customer)}
                                className="p-2 hover:bg-secondary rounded-lg"
                                title={t('customers.tooltip.edit')}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDisable(customer)}
                                className="p-2 hover:bg-secondary rounded-lg text-destructive"
                                title={t('customers.tooltip.disable')}
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleActivate(customer)}
                              className="p-2 hover:bg-secondary rounded-lg text-green-600"
                              title={t('customers.tooltip.activate')}
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
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editing ? t('customers.modal.edit') : t('customers.modal.add')}
            </h2>
            {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}
            <div className="space-y-4 mb-6">
              <FormField label={t('customers.type.label')} htmlFor="customer-type" required>
                <select
                  id="customer-type"
                  value={form.customer_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customer_type: e.target.value as CustomerType,
                      tax_code: e.target.value === 'COMPANY' ? form.tax_code : '',
                    })
                  }
                  className={selectClassName}
                >
                  <option value="INDIVIDUAL">{t('customers.type.individual')}</option>
                  <option value="COMPANY">{t('customers.type.company')}</option>
                  <option value="GROUP">{t('customers.type.group')}</option>
                </select>
              </FormField>
              <FormField label={t('customers.form.name')} htmlFor="customer-name" required>
                <input
                  id="customer-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('customers.form.phone')} htmlFor="customer-phone" required>
                <input
                  id="customer-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              {form.customer_type === 'COMPANY' && (
                <FormField label={t('customers.form.taxCode')} htmlFor="customer-tax-code" required>
                  <input
                    id="customer-tax-code"
                    value={form.tax_code}
                    onChange={(e) => setForm({ ...form, tax_code: e.target.value })}
                    className={inputClassName}
                  />
                </FormField>
              )}
              {(form.customer_type === 'COMPANY' || form.customer_type === 'GROUP') && (
                <FormField label={t('customers.form.contactPerson')} htmlFor="customer-contact-person">
                  <input
                    id="customer-contact-person"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    className={inputClassName}
                  />
                </FormField>
              )}
              <FormField label={t('customers.form.email')} htmlFor="customer-email">
                <input
                  id="customer-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('customers.form.address')} htmlFor="customer-address">
                <input
                  id="customer-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
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
            <h2 className="text-xl font-bold mb-4">{t('customers.history.title')}</h2>
            {historyLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="animate-spin" size={18} />
                {t('common.loading')}
              </div>
            ) : history ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('customers.history.orderCount')}</span>
                  <span className="font-semibold">{history.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('customers.history.totalSpent')}</span>
                  <span className="font-semibold">{formatMoney(history.total_spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('customers.history.lastPurchase')}</span>
                  <span className="font-semibold">
                    {formatDateTime(history.last_purchase_at ?? undefined)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">{t('customers.history.noData')}</p>
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

      <CustomerImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
