'use client';

import { useMemo, useState } from 'react';
import { Edit2, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { FormField, inputClassName } from '@/components/form-field';
import type { PermissionItem } from '@/hooks/use-permissions';
import {
  createRole,
  deleteRole,
  updateRole,
  type RoleItem,
} from '@/hooks/use-roles';
import { getRoleColor } from '@/lib/format';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

const RESERVED_CODES = new Set(['ADMIN', 'MANAGER', 'STAFF']);
const ROLE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,31}$/;

interface RoleFormState {
  code: string;
  name: string;
  description: string;
  permission_codes: string[];
}

const emptyForm: RoleFormState = {
  code: '',
  name: '',
  description: '',
  permission_codes: [],
};

interface CustomRolesPanelProps {
  customRoles: RoleItem[];
  permissions: PermissionItem[];
  onMutate: () => Promise<unknown>;
}

export function CustomRolesPanel({ customRoles, permissions, onMutate }: CustomRolesPanelProps) {
  const { t } = useTranslation();
  const { getModuleLabel, formatPermissionAction } = useFormat();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');

  const permissionsByModule = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    return permissions.reduce<Record<string, PermissionItem[]>>((acc, perm) => {
      if (query) {
        const haystack = `${perm.code} ${perm.module ?? ''} ${perm.action ?? ''}`.toLowerCase();
        if (!haystack.includes(query)) return acc;
      }
      const mod = perm.module ?? 'other';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});
  }, [permissions, permissionSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setPermissionSearch('');
    setShowModal(true);
  };

  const openEdit = (role: RoleItem) => {
    setEditing(role);
    setForm({
      code: role.code,
      name: role.name,
      description: role.description ?? '',
      permission_codes: [...role.permission_codes],
    });
    setFormError('');
    setPermissionSearch('');
    setShowModal(true);
  };

  const togglePermission = (code: string) => {
    setForm((prev) => {
      const selected = new Set(prev.permission_codes);
      if (selected.has(code)) {
        selected.delete(code);
      } else {
        selected.add(code);
      }
      return { ...prev, permission_codes: [...selected] };
    });
  };

  const toggleModule = (modulePerms: PermissionItem[], selectAll: boolean) => {
    setForm((prev) => {
      const selected = new Set(prev.permission_codes);
      for (const perm of modulePerms) {
        if (selectAll) {
          selected.add(perm.code);
        } else {
          selected.delete(perm.code);
        }
      }
      return { ...prev, permission_codes: [...selected] };
    });
  };

  const validateForm = () => {
    if (!editing) {
      const code = form.code.trim().toUpperCase();
      if (!code) return t('rbac.customPanel.validation.codeRequired');
      if (!ROLE_CODE_PATTERN.test(code)) {
        return t('rbac.customPanel.validation.codeFormat');
      }
      if (RESERVED_CODES.has(code)) {
        return t('rbac.customPanel.validation.codeReserved');
      }
    }

    if (!form.name.trim()) return t('rbac.customPanel.validation.nameRequired');
    if (form.permission_codes.length === 0) {
      return t('rbac.customPanel.validation.permissionsRequired');
    }

    return '';
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      if (editing) {
        await updateRole(editing.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          permission_codes: form.permission_codes,
        });
      } else {
        await createRole({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          permission_codes: form.permission_codes,
        });
      }
      await onMutate();
      setShowModal(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t('rbac.customPanel.error.actionFailed'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (role: RoleItem) => {
    if (
      !confirm(
        t('rbac.customPanel.confirm.delete', { name: role.name, code: role.code }),
      )
    ) {
      return;
    }

    try {
      await deleteRole(role.id);
      await onMutate();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : t('rbac.customPanel.error.deleteFailed'),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('rbac.customPanel.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('rbac.customPanel.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          <Plus size={18} />
          {t('rbac.customPanel.createRole')}
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {customRoles.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              {t('rbac.customPanel.empty')}
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
            >
              <Plus size={16} />
              {t('rbac.customPanel.createFirst')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left px-6 py-3 font-semibold">
                    {t('rbac.customPanel.table.role')}
                  </th>
                  <th className="text-left px-6 py-3 font-semibold">
                    {t('rbac.customPanel.table.description')}
                  </th>
                  <th className="text-center px-6 py-3 font-semibold">
                    {t('rbac.customPanel.table.permissionCount')}
                  </th>
                  <th className="text-center px-6 py-3 font-semibold">
                    {t('rbac.customPanel.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {customRoles.map((role) => (
                  <tr key={role.id} className="border-b border-border/60 hover:bg-secondary/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{role.name}</p>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getRoleColor(role.code)}`}
                        >
                          {role.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {role.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-center text-foreground">
                      {role.permission_codes.length}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(role)}
                          className="p-2 hover:bg-secondary rounded-lg"
                          title={t('rbac.customPanel.tooltip.edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(role)}
                          className="p-2 hover:bg-secondary rounded-lg text-destructive"
                          title={t('rbac.customPanel.tooltip.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                {editing
                  ? t('rbac.customPanel.modal.editTitle')
                  : t('rbac.customPanel.modal.createTitle')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {editing
                  ? t('rbac.customPanel.modal.editSubtitle')
                  : t('rbac.customPanel.modal.createSubtitle')}
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {formError && (
                <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              {!editing && (
                <FormField
                  label={t('rbac.customPanel.form.code')}
                  htmlFor="role-code"
                  required
                  hint={t('rbac.customPanel.form.codeHint')}
                >
                  <input
                    id="role-code"
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    placeholder={t('rbac.customPanel.form.codePlaceholder')}
                    className={inputClassName}
                  />
                </FormField>
              )}

              {editing && (
                <FormField label={t('rbac.customPanel.form.code')} htmlFor="role-code-readonly">
                  <input
                    id="role-code-readonly"
                    value={form.code}
                    disabled
                    className={`${inputClassName} opacity-60 cursor-not-allowed`}
                  />
                </FormField>
              )}

              <FormField
                label={t('rbac.customPanel.form.displayName')}
                htmlFor="role-name"
                required
              >
                <input
                  id="role-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('rbac.customPanel.form.displayNamePlaceholder')}
                  className={inputClassName}
                />
              </FormField>

              <FormField label={t('rbac.customPanel.form.description')} htmlFor="role-description">
                <textarea
                  id="role-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder={t('rbac.customPanel.form.descriptionPlaceholder')}
                  className={`${inputClassName} resize-none`}
                />
              </FormField>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <label className="text-sm font-medium text-foreground">
                    {t('rbac.customPanel.form.permissions')}{' '}
                    <span className="text-destructive">*</span>
                    <span className="text-muted-foreground font-normal ml-2">
                      {t('rbac.customPanel.form.permissionsSelected', {
                        count: form.permission_codes.length,
                      })}
                    </span>
                  </label>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      placeholder={t('rbac.customPanel.form.searchPermissions')}
                      className="pl-9 pr-3 py-1.5 text-sm border border-input rounded-lg bg-background w-full sm:w-48"
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg max-h-64 overflow-y-auto divide-y divide-border">
                  {Object.keys(permissionsByModule).length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">
                      {t('rbac.customPanel.form.noPermissions')}
                    </p>
                  ) : (
                    Object.entries(permissionsByModule).map(([module, perms]) => {
                      const allSelected = perms.every((p) =>
                        form.permission_codes.includes(p.code),
                      );
                      const someSelected = perms.some((p) =>
                        form.permission_codes.includes(p.code),
                      );

                      return (
                        <div key={module} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {getModuleLabel(module)}
                            </p>
                            <button
                              type="button"
                              onClick={() => toggleModule(perms, !allSelected)}
                              className="text-xs text-primary hover:underline"
                            >
                              {allSelected
                                ? t('rbac.customPanel.form.deselectAll')
                                : t('rbac.customPanel.form.selectAll')}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {perms.map((perm) => {
                              const checked = form.permission_codes.includes(perm.code);
                              const label = perm.action
                                ? formatPermissionAction(perm.action)
                                : perm.code;

                              return (
                                <label
                                  key={perm.code}
                                  className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                                    checked ? 'bg-primary/5' : 'hover:bg-secondary/50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => togglePermission(perm.code)}
                                    className="mt-0.5"
                                  />
                                  <span>
                                    <span className="font-medium text-foreground">{label}</span>
                                    <span className="block text-xs text-muted-foreground font-mono">
                                      {perm.code}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting
                  ? t('common.saving')
                  : editing
                    ? t('common.update')
                    : t('rbac.customPanel.createRole')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
