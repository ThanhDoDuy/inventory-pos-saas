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
import { formatPermissionAction, getModuleLabel } from '@/lib/rbac-utils';

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
      if (!code) return 'Vui lòng nhập mã vai trò';
      if (!ROLE_CODE_PATTERN.test(code)) {
        return 'Mã vai trò phải viết HOA, bắt đầu bằng chữ cái (ví dụ: WAREHOUSE_LEAD)';
      }
      if (RESERVED_CODES.has(code)) {
        return 'Mã ADMIN, MANAGER, STAFF là vai trò hệ thống — không dùng được';
      }
    }

    if (!form.name.trim()) return 'Vui lòng nhập tên vai trò';
    if (form.permission_codes.length === 0) return 'Chọn ít nhất một quyền';

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
      setFormError(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (role: RoleItem) => {
    if (!confirm(`Xóa vai trò "${role.name}" (${role.code})? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      await deleteRole(role.id);
      await onMutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa vai trò');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Vai trò tùy chỉnh</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo và quản lý vai trò riêng cho cửa hàng của bạn
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          <Plus size={18} />
          Tạo vai trò
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {customRoles.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              Chưa có vai trò tùy chỉnh. Bấm &quot;Tạo vai trò&quot; để thêm mới.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
            >
              <Plus size={16} />
              Tạo vai trò đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left px-6 py-3 font-semibold">Vai trò</th>
                  <th className="text-left px-6 py-3 font-semibold">Mô tả</th>
                  <th className="text-center px-6 py-3 font-semibold">Số quyền</th>
                  <th className="text-center px-6 py-3 font-semibold">Thao tác</th>
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
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(role)}
                          className="p-2 hover:bg-secondary rounded-lg text-destructive"
                          title="Xóa"
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
                {editing ? 'Sửa vai trò' : 'Tạo vai trò mới'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {editing
                  ? 'Cập nhật tên, mô tả và quyền của vai trò tùy chỉnh'
                  : 'Mã vai trò không thể đổi sau khi tạo'}
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
                  label="Mã vai trò"
                  htmlFor="role-code"
                  required
                  hint="Viết HOA, ví dụ: WAREHOUSE_LEAD"
                >
                  <input
                    id="role-code"
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    placeholder="WAREHOUSE_LEAD"
                    className={inputClassName}
                  />
                </FormField>
              )}

              {editing && (
                <FormField label="Mã vai trò" htmlFor="role-code-readonly">
                  <input
                    id="role-code-readonly"
                    value={form.code}
                    disabled
                    className={`${inputClassName} opacity-60 cursor-not-allowed`}
                  />
                </FormField>
              )}

              <FormField label="Tên hiển thị" htmlFor="role-name" required>
                <input
                  id="role-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Trưởng kho"
                  className={inputClassName}
                />
              </FormField>

              <FormField label="Mô tả" htmlFor="role-description">
                <textarea
                  id="role-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Mô tả ngắn về vai trò..."
                  className={`${inputClassName} resize-none`}
                />
              </FormField>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <label className="text-sm font-medium text-foreground">
                    Quyền <span className="text-destructive">*</span>
                    <span className="text-muted-foreground font-normal ml-2">
                      ({form.permission_codes.length} đã chọn)
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
                      placeholder="Tìm quyền..."
                      className="pl-9 pr-3 py-1.5 text-sm border border-input rounded-lg bg-background w-full sm:w-48"
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg max-h-64 overflow-y-auto divide-y divide-border">
                  {Object.keys(permissionsByModule).length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">
                      Không tìm thấy quyền phù hợp
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
                              {allSelected ? 'Bỏ chọn' : someSelected ? 'Chọn tất cả' : 'Chọn tất cả'}
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
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo vai trò'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
