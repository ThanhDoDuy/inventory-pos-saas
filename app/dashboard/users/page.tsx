'use client';

import { Users, Plus, Search, Trash2, Shield, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createUser, disableUser, useUsers } from '@/hooks/use-users';
import { useRoles } from '@/hooks/use-roles';
import { formatDateTime, getRoleColor } from '@/lib/format';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role_id: '',
  });

  const { roles } = useRoles();
  const selectedRoleId =
    selectedRole === 'all'
      ? undefined
      : roles.find((r) => r.code.toUpperCase() === selectedRole.toUpperCase())?.id;

  const { users, total, isLoading, error, mutate } = useUsers(
    searchTerm || undefined,
    selectedRoleId,
  );

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const admins = users.filter((u) => u.role?.code === 'ADMIN').length;
    return { total: total || users.length, active, admins };
  }, [users, total]);

  const handleCreate = async () => {
    setFormError('');
    if (!form.username || !form.email || !form.password || !form.role_id) {
      setFormError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        username: form.username,
        email: form.email,
        password: form.password,
        role_id: form.role_id,
      });
      await mutate();
      setShowAddModal(false);
      setForm({ username: '', email: '', password: '', role_id: '' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể tạo người dùng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async (userId: string, username: string) => {
    if (!confirm(`Vô hiệu hóa người dùng "${username}"?`)) return;
    try {
      await disableUser(userId);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể vô hiệu hóa người dùng');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Quản lý thành viên và phân quyền</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Thêm người dùng
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Tổng người dùng</p>
          <p className="text-3xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Đang hoạt động</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Quản trị viên</p>
          <p className="text-3xl font-bold text-primary">{stats.admins}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <FormField label="Tìm kiếm" htmlFor="user-search">
              <div className="flex items-center gap-2">
                <Search size={20} className="text-muted-foreground shrink-0" />
                <input
                  id="user-search"
                  type="text"
                  placeholder="Tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClassName} flex-1`}
                />
              </div>
            </FormField>
          </div>
          <div className="md:w-48">
            <FormField label="Vai trò" htmlFor="user-role-filter">
              <select
                id="user-role-filter"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={selectClassName}
              >
                <option value="all">Tất cả</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Staff</option>
              </select>
            </FormField>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            Đang tải...
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">Không tải được danh sách người dùng</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Người dùng</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Vai trò</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Đăng nhập cuối</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Không có người dùng
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
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Shield size={16} />
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role?.code)}`}
                          >
                            {user.role?.name ?? user.role?.code ?? '—'}
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
                          {user.status === 'ACTIVE' ? 'Hoạt động' : user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(user.last_login_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleDisable(user.id, user.username)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors text-destructive"
                            title="Vô hiệu hóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">Thêm người dùng</h2>
            {formError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                {formError}
              </div>
            )}
            <div className="space-y-4 mb-6">
              <FormField label="Tên đăng nhập" htmlFor="user-username" required>
                <input
                  id="user-username"
                  type="text"
                  placeholder="admin"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Email" htmlFor="user-email" required>
                <input
                  id="user-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Vai trò" htmlFor="user-role" required>
                <select
                  id="user-role"
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">— Chọn vai trò —</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} ({role.code})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Mật khẩu tạm" htmlFor="user-password" required hint="Tối thiểu 8 ký tự">
                <input
                  id="user-password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={8}
                  className={inputClassName}
                />
              </FormField>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors text-foreground"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Đang tạo...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
