'use client';

import { Shield, Loader2 } from 'lucide-react';
import { useRoles } from '@/hooks/use-roles';
import { usePermissions } from '@/hooks/use-permissions';
import { getRoleColor } from '@/lib/format';

export default function RbacPage() {
  const { roles, isLoading: rolesLoading, error: rolesError } = useRoles();
  const { permissions, isLoading: permLoading, error: permError } = usePermissions();

  const permissionsByModule = permissions.reduce<Record<string, typeof permissions>>(
    (acc, perm) => {
      const mod = perm.module ?? 'Khác';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    },
    {},
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Vai trò & Quyền</h1>
        <p className="text-muted-foreground">Quản lý phân quyền theo vai trò trong cửa hàng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={22} className="text-primary" />
            <h2 className="text-xl font-bold text-foreground">Vai trò hệ thống</h2>
          </div>

          {rolesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="animate-spin" size={18} />
              Đang tải...
            </div>
          ) : rolesError ? (
            <p className="text-destructive text-sm">Không tải được danh sách vai trò</p>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div key={role.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-foreground">{role.name}</p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${getRoleColor(role.code)}`}
                    >
                      {role.code}
                    </span>
                  </div>
                  {role.is_system && (
                    <p className="text-xs text-muted-foreground">Vai trò hệ thống — không thể xóa</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">Danh sách quyền</h2>

          {permLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="animate-spin" size={18} />
              Đang tải...
            </div>
          ) : permError ? (
            <p className="text-destructive text-sm">Không tải được danh sách quyền</p>
          ) : (
            <div className="space-y-4 max-h-[480px] overflow-y-auto">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module}>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    {module}
                  </p>
                  <div className="space-y-1">
                    {perms.map((perm) => (
                      <div
                        key={perm.code}
                        className="flex items-center justify-between px-3 py-2 bg-secondary rounded text-sm"
                      >
                        <span className="text-foreground font-mono text-xs">{perm.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        Chỉnh sửa vai trò tùy chỉnh qua API `POST/PATCH /rbac/roles` — UI CRUD sẽ bổ sung sau.
      </p>
    </div>
  );
}
