export interface RolePermissionSource {
  is_wildcard?: boolean;
  permission_codes: string[];
}

export function roleGrantsPermission(
  role: RolePermissionSource,
  permissionCode: string,
): boolean {
  if (role.is_wildcard || role.permission_codes.includes('*')) {
    return true;
  }

  if (role.permission_codes.includes(permissionCode)) {
    return true;
  }

  const [resource] = permissionCode.split(':');
  return role.permission_codes.includes(`${resource}:*`);
}

export function hasAllPermissions(
  role: RolePermissionSource,
  permissionCodes: string[],
): boolean {
  return permissionCodes.every((code) => roleGrantsPermission(role, code));
}

export function hasAnyPermission(
  role: RolePermissionSource,
  permissionCodes: string[],
): boolean {
  return permissionCodes.some((code) => roleGrantsPermission(role, code));
}

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function getModuleLabel(module: string, t: TranslateFn) {
  const key = `rbac.modules.${module === 'other' ? 'other' : module}`;
  const label = t(key);
  return label === key ? module : label;
}

export function formatPermissionAction(action: string, t: TranslateFn) {
  const key = `rbac.actions.${action}`;
  const label = t(key);
  return label === key ? action : label;
}
