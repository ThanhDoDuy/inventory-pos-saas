'use client';

import { useState } from 'react';
import { Users, Plus, Search, Edit2, History, Ban, Loader2 } from 'lucide-react';
import {
  createCustomer,
  disableCustomer,
  updateCustomer,
  useCustomerHistory,
  useCustomers,
  type CustomerItem,
} from '@/hooks/use-customers';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

const emptyForm = { name: '', phone: '', email: '', address: '' };

export default function CustomersPage() {
  const { t } = useTranslation();
  const { formatMoney, formatDateTime, getPartyStatusLabel } = useFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomerItem | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { customers, total, isLoading, error, mutate } = useCustomers(
    searchTerm || undefined,
    statusFilter,
  );
  const { history, isLoading: historyLoading } = useCustomerHistory(historyId);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (customer: CustomerItem) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
      address: customer.address ?? '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError(t('customers.error.requiredFields'));
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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('customers.title')}</h1>
          <p className="text-muted-foreground">{t('customers.subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          <Plus size={20} />
          {t('customers.add')}
        </button>
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
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('customers.table.contact')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('customers.table.status')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('customers.table.lastPurchase')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">{t('customers.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
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
                            {customer.address && (
                              <p className="text-xs text-muted-foreground">{customer.address}</p>
                            )}
                          </div>
                        </div>
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
                          {customer.status === 'ACTIVE' && (
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
              {editing ? t('customers.modal.edit') : t('customers.modal.add')}
            </h2>
            {formError && <p className="text-destructive text-sm mb-4">{formError}</p>}
            <div className="space-y-4 mb-6">
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
    </div>
  );
}
