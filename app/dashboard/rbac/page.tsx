'use client';

import { useMemo, useState } from 'react';
import {
  Shield,
  Loader2,
  Check,
  Minus,
  Lock,
  Users,
  KeyRound,
  Table2,
  UserCog,
} from 'lucide-react';
import { CustomRolesPanel } from '@/components/rbac/custom-roles-panel';
import { useRoles } from '@/hooks/use-roles';
import { usePermissions } from '@/hooks/use-permissions';
import { getRoleColor } from '@/lib/format';
import {
  formatPermissionAction,
  getModuleLabel,
  roleGrantsPermission,
} from '@/lib/rbac-utils';
import { useTranslation } from '@/lib/i18n/use-translation';

type RbacTab = 'overview' | 'matrix' | 'custom';

export default function RbacPage() {
  const { t } = useTranslation();
  const { roles, isLoading: rolesLoading, error: rolesError, mutate } = useRoles();
  const { permissions, isLoading: permLoading, error: permError } = usePermissions();
  const [activeTab, setActiveTab] = useState<RbacTab>('overview');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const tabs: { id: RbacTab; label: string; icon: typeof Shield }[] = [
    { id: 'overview', label: t('rbac.tabs.overview'), icon: Shield },
    { id: 'matrix', label: t('rbac.tabs.matrix'), icon: Table2 },
    { id: 'custom', label: t('rbac.tabs.custom'), icon: UserCog },
  ];

  const isLoading = rolesLoading || permLoading;
  const hasError = rolesError || permError;

  const selectedRole = useMemo(() => {
    if (!roles.length) return null;
    if (selectedRoleId) {
      return roles.find((role) => role.id === selectedRoleId) ?? roles[0];
    }
    return roles[0];
  }, [roles, selectedRoleId]);

  const permissionsByModule = useMemo(() => {
    return permissions.reduce<Record<string, typeof permissions>>((acc, perm) => {
      const mod = perm.module ?? 'other';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});
  }, [permissions]);

  const stats = useMemo(() => {
    const systemRoles = roles.filter((r) => r.is_system).length;
    const customRoles = roles.filter((r) => !r.is_system).length;
    return {
      roleCount: roles.length,
      permissionCount: permissions.length,
      systemRoles,
      customRoles,
    };
  }, [roles, permissions]);

  const customRoles = useMemo(() => roles.filter((r) => !r.is_system), [roles]);

  const grantedCountForRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return 0;
    if (role.is_wildcard) return permissions.length;
    return permissions.filter((perm) => roleGrantsPermission(role, perm.code)).length;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('rbac.title')}</h1>
        <p className="text-muted-foreground">{t('rbac.subtitle')}</p>
      </div>

      <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
          <Loader2 className="animate-spin" size={20} />
          {t('rbac.loading')}
        </div>
      ) : hasError ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-destructive text-sm">
          {t('rbac.error.loadFailed')}
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Shield className="text-primary" size={22} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.roleCount}</p>
                    <p className="text-sm text-muted-foreground">{t('rbac.stats.roles')}</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/10">
                    <KeyRound className="text-blue-600" size={22} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.permissionCount}</p>
                    <p className="text-sm text-muted-foreground">{t('rbac.stats.permissions')}</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/10">
                    <Users className="text-green-600" size={22} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.systemRoles}
                      {stats.customRoles > 0 && (
                        <span className="text-base font-normal text-muted-foreground">
                          {' '}
                          {t('rbac.stats.customSuffix', { count: stats.customRoles })}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('rbac.stats.systemRoles')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-card rounded-lg border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">{t('rbac.rolesInStore')}</h2>
                  <div className="space-y-2">
                    {roles.map((role) => {
                      const isSelected = selectedRole?.id === role.id;
                      const granted = grantedCountForRole(role.id);

                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRoleId(role.id)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-foreground">{role.name}</p>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${getRoleColor(role.code)}`}
                            >
                              {role.code}
                            </span>
                          </div>
                          {role.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {role.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {role.is_system ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Lock size={12} />
                                {t('rbac.system')}
                              </span>
                            ) : (
                              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                {t('rbac.custom')}
                              </span>
                            )}
                            {role.is_wildcard ? (
                              <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                {t('rbac.fullAccess')}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {t('rbac.permissionsCount', { granted, total: permissions.length })}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="xl:col-span-2 bg-card rounded-lg border border-border p-6">
                  {selectedRole ? (
                    <>
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                          <h2 className="text-lg font-bold text-foreground">
                            {t('rbac.rolePermissions', { roleName: selectedRole.name })}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedRole.is_wildcard
                              ? t('rbac.wildcardDesc')
                              : t('rbac.permissionsCount', {
                                  granted: grantedCountForRole(selectedRole.id),
                                  total: permissions.length,
                                })}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${getRoleColor(selectedRole.code)}`}
                        >
                          {selectedRole.code}
                        </span>
                      </div>

                      {selectedRole.is_wildcard ? (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
                          <Check className="mx-auto text-green-600 mb-2" size={28} />
                          <p className="font-semibold text-green-800">{t('rbac.fullAccess')}</p>
                          <p className="text-sm text-green-700 mt-1">
                            {t('rbac.wildcardGranted')}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-5 max-h-[520px] overflow-y-auto pr-1">
                          {Object.entries(permissionsByModule).map(([module, perms]) => (
                            <div key={module}>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                {getModuleLabel(module)}
                              </p>
                              <div className="space-y-1">
                                {perms.map((perm) => {
                                  const granted = roleGrantsPermission(selectedRole, perm.code);
                                  const actionLabel = perm.action
                                    ? formatPermissionAction(perm.action)
                                    : perm.code;

                                  return (
                                    <div
                                      key={perm.code}
                                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm ${
                                        granted
                                          ? 'bg-green-50 border border-green-100'
                                          : 'bg-secondary/60'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <p className="font-medium text-foreground">{actionLabel}</p>
                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                          {perm.code}
                                        </p>
                                      </div>
                                      {granted ? (
                                        <Check size={18} className="text-green-600 shrink-0" />
                                      ) : (
                                        <Minus size={18} className="text-muted-foreground/50 shrink-0" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm py-8 text-center">
                      {t('rbac.empty.noRoles')}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'matrix' && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">{t('rbac.permissionMatrix')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('rbac.matrixDesc')}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-foreground min-w-[220px] sticky left-0 bg-secondary/50 z-10">
                        {t('rbac.table.permission')}
                      </th>
                      {roles.map((role) => (
                        <th
                          key={role.id}
                          className="text-center px-4 py-3 font-semibold text-foreground min-w-[100px]"
                        >
                          <span
                            className={`inline-block text-xs px-2 py-0.5 rounded-full ${getRoleColor(role.code)}`}
                          >
                            {role.code}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(permissionsByModule).flatMap(([module, perms]) => [
                      <tr key={`module-${module}`} className="bg-muted/30">
                        <td
                          colSpan={roles.length + 1}
                          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sticky left-0"
                        >
                          {getModuleLabel(module)}
                        </td>
                      </tr>,
                      ...perms.map((perm) => (
                        <tr
                          key={perm.code}
                          className="border-b border-border/60 hover:bg-secondary/30"
                        >
                          <td className="px-4 py-2.5 sticky left-0 bg-card z-10">
                            <p className="font-medium text-foreground">
                              {perm.action ? formatPermissionAction(perm.action) : perm.code}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">{perm.code}</p>
                          </td>
                          {roles.map((role) => {
                            const granted = roleGrantsPermission(role, perm.code);
                            return (
                              <td key={`${perm.code}-${role.id}`} className="text-center px-4 py-2.5">
                                {granted ? (
                                  <Check size={16} className="inline text-green-600" />
                                ) : (
                                  <Minus size={16} className="inline text-muted-foreground/40" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      )),
                    ])}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <CustomRolesPanel
              customRoles={customRoles}
              permissions={permissions}
              onMutate={mutate}
            />
          )}
        </>
      )}
    </div>
  );
}
