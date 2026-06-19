'use client';

import { useMemo, useState } from 'react';
import { Building2, Loader2, Search, Users } from 'lucide-react';
import {
  createCustomer,
  useCustomers,
  type CustomerItem,
  type CustomerType,
} from '@/hooks/use-customers';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';
import { useTranslation } from '@/lib/i18n/use-translation';
import { stringifyId } from '@/lib/format';

type CustomerSubMode = 'existing' | 'new';

const emptyNewForm = {
  customer_type: 'COMPANY' as CustomerType,
  name: '',
  phone: '',
  email: '',
  address: '',
  tax_code: '',
  contact_person: '',
};

interface PosCustomerPanelProps {
  selectedCustomer: CustomerItem | null;
  onSelectCustomer: (customer: CustomerItem | null) => void;
}

export function PosCustomerPanel({
  selectedCustomer,
  onSelectCustomer,
}: PosCustomerPanelProps) {
  const { t } = useTranslation();
  const [subMode, setSubMode] = useState<CustomerSubMode>('existing');
  const [searchTerm, setSearchTerm] = useState('');
  const [newForm, setNewForm] = useState(emptyNewForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const { customers, isLoading } = useCustomers(debouncedSearch || undefined, 'ACTIVE');

  const businessCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customer.customer_type === 'COMPANY' || customer.customer_type === 'GROUP',
      ),
    [customers],
  );

  const getTypeLabel = (type: CustomerType) => {
    if (type === 'COMPANY') return t('pos.business.typeCompany');
    if (type === 'GROUP') return t('pos.business.typeGroup');
    return type;
  };

  const handleCreateAndSelect = async () => {
    if (!newForm.name.trim() || !newForm.phone.trim()) {
      setFormError(t('customers.error.requiredFields'));
      return;
    }
    if (newForm.customer_type === 'COMPANY' && !newForm.tax_code.trim()) {
      setFormError(t('customers.error.taxCodeRequired'));
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      const raw = await createCustomer({
        customer_type: newForm.customer_type,
        name: newForm.name.trim(),
        phone: newForm.phone.trim(),
        email: newForm.email.trim() || undefined,
        address: newForm.address.trim() || undefined,
        tax_code:
          newForm.customer_type === 'COMPANY' ? newForm.tax_code.trim() : undefined,
        contact_person: newForm.contact_person.trim() || undefined,
      });

      const created: CustomerItem = {
        id: stringifyId((raw as Record<string, unknown>).id ?? (raw as Record<string, unknown>)._id),
        customer_type: newForm.customer_type,
        name: newForm.name.trim(),
        phone: newForm.phone.trim(),
        email: newForm.email.trim() || undefined,
        address: newForm.address.trim() || undefined,
        tax_code:
          newForm.customer_type === 'COMPANY' ? newForm.tax_code.trim() : undefined,
        contact_person: newForm.contact_person.trim() || undefined,
        status: 'ACTIVE',
      };

      onSelectCustomer(created);
      setNewForm(emptyNewForm);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('pos.business.createFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (selectedCustomer) {
    return (
      <div className="bg-card rounded-lg border border-primary/30 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              {selectedCustomer.customer_type === 'COMPANY' ? (
                <Building2 size={20} className="text-primary" />
              ) : (
                <Users size={20} className="text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('pos.business.sellingTo')}</p>
              <p className="text-lg font-bold text-foreground">{selectedCustomer.name}</p>
              <p className="text-sm text-muted-foreground">
                {getTypeLabel(selectedCustomer.customer_type)} · {selectedCustomer.phone}
              </p>
              {selectedCustomer.tax_code && (
                <p className="text-sm text-muted-foreground">
                  {t('customers.form.taxCode')}: {selectedCustomer.tax_code}
                </p>
              )}
              {selectedCustomer.contact_person && (
                <p className="text-sm text-muted-foreground">{selectedCustomer.contact_person}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectCustomer(null)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t('pos.business.changeCustomer')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-1">{t('pos.business.customerTitle')}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t('pos.business.customerSubtitle')}</p>

      {formError && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSubMode('existing')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            subMode === 'existing'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:bg-secondary'
          }`}
        >
          {t('pos.business.selectExisting')}
        </button>
        <button
          type="button"
          onClick={() => setSubMode('new')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            subMode === 'new'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:bg-secondary'
          }`}
        >
          {t('pos.business.createNew')}
        </button>
      </div>

      {subMode === 'existing' ? (
        <div className="space-y-3">
          <FormField label={t('pos.business.searchCustomer')} htmlFor="business-customer-search">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                id="business-customer-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('pos.business.searchPlaceholder')}
                className={`${inputClassName} flex-1`}
              />
            </div>
          </FormField>

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="animate-spin" size={18} />
              {t('common.loading')}
            </div>
          ) : businessCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('pos.business.noCustomers')}
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {businessCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => onSelectCustomer(customer)}
                  className="w-full text-left p-3 hover:bg-secondary/50 transition-colors"
                >
                  <p className="font-semibold text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getTypeLabel(customer.customer_type)} · {customer.phone}
                    {customer.tax_code ? ` · MST ${customer.tax_code}` : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <FormField label={t('customers.type.label')} htmlFor="new-customer-type" required>
            <select
              id="new-customer-type"
              value={newForm.customer_type}
              onChange={(e) =>
                setNewForm({
                  ...newForm,
                  customer_type: e.target.value as CustomerType,
                  tax_code: e.target.value === 'COMPANY' ? newForm.tax_code : '',
                })
              }
              className={selectClassName}
            >
              <option value="COMPANY">{t('pos.business.typeCompany')}</option>
              <option value="GROUP">{t('pos.business.typeGroup')}</option>
            </select>
          </FormField>
          <FormField label={t('customers.form.name')} htmlFor="new-customer-name" required>
            <input
              id="new-customer-name"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              className={inputClassName}
            />
          </FormField>
          <FormField label={t('customers.form.phone')} htmlFor="new-customer-phone" required>
            <input
              id="new-customer-phone"
              value={newForm.phone}
              onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
              className={inputClassName}
            />
          </FormField>
          {newForm.customer_type === 'COMPANY' && (
            <FormField label={t('customers.form.taxCode')} htmlFor="new-customer-tax" required>
              <input
                id="new-customer-tax"
                value={newForm.tax_code}
                onChange={(e) => setNewForm({ ...newForm, tax_code: e.target.value })}
                className={inputClassName}
              />
            </FormField>
          )}
          <FormField label={t('customers.form.contactPerson')} htmlFor="new-customer-contact">
            <input
              id="new-customer-contact"
              value={newForm.contact_person}
              onChange={(e) => setNewForm({ ...newForm, contact_person: e.target.value })}
              className={inputClassName}
            />
          </FormField>
          <FormField label={t('customers.form.email')} htmlFor="new-customer-email">
            <input
              id="new-customer-email"
              type="email"
              value={newForm.email}
              onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
              className={inputClassName}
            />
          </FormField>
          <FormField label={t('customers.form.address')} htmlFor="new-customer-address">
            <input
              id="new-customer-address"
              value={newForm.address}
              onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
              className={inputClassName}
            />
          </FormField>
          <button
            type="button"
            onClick={handleCreateAndSelect}
            disabled={isSaving}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="animate-spin" size={16} />}
            {t('pos.business.saveAndSelect')}
          </button>
        </div>
      )}
    </div>
  );
}
