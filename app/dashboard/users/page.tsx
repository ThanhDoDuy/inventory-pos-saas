'use client';

import {
  Users,
  Plus,
  Search,
  Trash2,
  Shield,
  Loader2,
  Edit2,
  KeyRound,
  CheckCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  activateUser,
  assignUserRole,
  createUser,
  disableUser,
  resetUserPassword,
  updateUser,
  useUsers,
  type UserProfile,
} from '@/hooks/use-users';
import { useRoles } from '@/hooks/use-roles';
import { getRoleColor } from '@/lib/format';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';
import { PaginationBar } from '@/components/pagination-bar';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

export default function UsersPage() {
  const { t } = useTranslation();
  const { formatDateTime, getPartyStatusLabel } = useFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [resetUser, setResetUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    role_id: '',
  });
  const [editForm, setEditForm] = useState({ username: '', role_id: '' });
  const [newPassword, setNewPassword] = useState('');
  const [page, setPage] = useState(1);

  const { roles } = useRoles();
  const selectedRoleId =
    selectedRole === 'all'
      ? undefined
      : roles.find((r) => r.code.toUpperCase() === selectedRole.toUpperCase())?.id;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedRoleId]);

  const { users, total, pagination, isLoading, error, mutate } = useUsers(
    searchTerm || undefined,
    selectedRoleId,
    page,
  );

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const admins = users.filter((u) => u.role?.code === 'ADMIN').length;
    return { total: total || users.length, active, admins };
  }, [users, total]);

  const handleCreate = async () => {
    setFormError('');
    if (!createForm.username || !createForm.email || !createForm.password || !createForm.role_id) {
      setFormError(t('users.error.requiredFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        role_id: createForm.role_id,
      });
      await mutate();
      setShowAddModal(false);
      setCreateForm({ username: '', email: '', password: '', role_id: '' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('users.error.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      role_id: user.role?.id ?? '',
    });
    setFormError('');
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    if (!editForm.username.trim() || (!editingUser.is_owner && !editForm.role_id)) {
      setFormError(t('users.error.requiredFields'));
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await updateUser(editingUser.id, { username: editForm.username.trim() });
      if (
        !editingUser.is_owner &&
        editForm.role_id !== editingUser.role?.id
      ) {
        await assignUserRole(editingUser.id, editForm.role_id);
      }
      await mutate();
      setEditingUser(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('users.error.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    if (newPassword.length < 8) {
      setFormError(t('users.error.passwordTooShort'));
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await resetUserPassword(resetUser.id, newPassword);
      setResetUser(null);
      setNewPassword('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('users.error.resetPasswordFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async (userId: string, username: string) => {
    if (!confirm(t('users.confirm.disable', { username }))) return;
    try {
      await disableUser(userId);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('users.error.disableFailed'));
    }
  };

  const handleActivate = async (user: UserProfile) => {
    if (!confirm(t('users.confirm.activate', { username: user.username }))) return;
    try {
      await activateUser(user.id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('users.error.activateFailed'));
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('users.title')}</h1>
          <p className="text-muted-foreground">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          {t('users.add')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t('users.stats.total')}</p>
          <p className="text-3xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t('users.stats.active')}</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t('users.stats.admins')}</p>
          <p className="text-3xl font-bold text-primary">{stats.admins}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <FormField label={t('common.search')} htmlFor="user-search">
              <div className="flex items-center gap-2">
                <Search size={20} className="text-muted-foreground shrink-0" />
                <input
                  id="user-search"
                  type="text"
                  placeholder={t('users.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClassName} flex-1`}
                />
              </div>
            </FormField>
          </div>
          <div className="md:w-48">
            <FormField label={t('users.role')} htmlFor="user-role-filter">
              <select
                id="user-role-filter"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={selectClassName}
              >
                <option value="all">{t('users.filter.all')}</option>
                <option value="ADMIN">{t('users.filter.admin')}</option>
                <option value="MANAGER">{t('users.filter.manager')}</option>
                <option value="STAFF">{t('users.filter.staff')}</option>
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
          <p className="text-center py-12 text-destructive">{t('users.error.loadFailed')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t('users.table.user')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t('users.table.email')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t('users.table.role')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t('users.table.status')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t('users.table.lastLogin')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">{t('users.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      {t('users.empty.noUsers')}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users size={20} className="text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{user.username}</span>
                          {user.is_owner && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              {t('users.badge.owner')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Shield size={16} />
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role?.code)}`}
                          >
                            {user.role?.name ?? user.role?.code ?? t('common.none')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.status === 'ACTIVE'
                            ? t('users.status.active')
                            : getPartyStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(user.last_login_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {user.status === 'ACTIVE' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(user)}
                                className="p-2 hover:bg-secondary rounded-lg"
                                title={t('users.tooltip.edit')}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormError('');
                                  setNewPassword('');
                                  setResetUser(user);
                                }}
                                className="p-2 hover:bg-secondary rounded-lg text-primary"
                                title={t('users.tooltip.resetPassword')}
                              >
                                <KeyRound size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDisable(user.id, user.username)}
                                className="p-2 hover:bg-secondary rounded-lg text-destructive"
                                title={t('users.tooltip.disable')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivate(user)}
                              className="p-2 hover:bg-secondary rounded-lg text-green-600"
                              title={t('users.tooltip.activate')}
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
        <PaginationBar pagination={pagination} onPageChange={setPage} isLoading={isLoading} />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">{t('users.modal.add')}</h2>
            {formError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                {formError}
              </div>
            )}
            <div className="space-y-4 mb-6">
              <FormField label={t('users.form.username')} htmlFor="user-username" required>
                <input
                  id="user-username"
                  type="text"
                  placeholder={t('users.placeholders.username')}
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('users.form.email')} htmlFor="user-email" required>
                <input
                  id="user-email"
                  type="email"
                  placeholder={t('users.placeholders.email')}
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('users.form.role')} htmlFor="user-role" required>
                <select
                  id="user-role"
                  value={createForm.role_id}
                  onChange={(e) => setCreateForm({ ...createForm, role_id: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">{t('users.placeholders.roleSelect')}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} ({role.code})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t('users.form.password')} htmlFor="user-password" required hint={t('users.form.passwordHint')}>
                <input
                  id="user-password"
                  type="password"
                  placeholder={t('users.placeholders.password')}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  minLength={8}
                  className={inputClassName}
                />
              </FormField>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors text-foreground"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t('common.creating') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">{t('users.modal.edit')}</h2>
            {formError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                {formError}
              </div>
            )}
            <div className="space-y-4 mb-6">
              <FormField label={t('users.form.username')} htmlFor="edit-username" required>
                <input
                  id="edit-username"
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('users.form.role')} htmlFor="edit-role" required={!editingUser.is_owner}>
                {editingUser.is_owner ? (
                  <div className="space-y-1">
                    <p className="px-3 py-2 rounded-lg border border-border bg-muted text-foreground">
                      {editingUser.role?.name ?? editingUser.role?.code ?? t('common.none')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('users.form.ownerRoleLocked')}</p>
                  </div>
                ) : (
                  <select
                    id="edit-role"
                    value={editForm.role_id}
                    onChange={(e) => setEditForm({ ...editForm, role_id: e.target.value })}
                    className={selectClassName}
                  >
                    <option value="">{t('users.placeholders.roleSelect')}</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} ({role.code})
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={isSubmitting}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleEdit}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {isSubmitting ? t('common.saving') : t('common.update')}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('users.modal.resetPassword')}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t('users.resetPasswordFor', { username: resetUser.username })}
            </p>
            {formError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                {formError}
              </div>
            )}
            <FormField label={t('users.form.newPassword')} htmlFor="new-password" required hint={t('users.form.passwordHint')}>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                className={inputClassName}
              />
            </FormField>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setResetUser(null)}
                disabled={isSubmitting}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {isSubmitting ? t('common.saving') : t('users.resetPasswordSubmit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
