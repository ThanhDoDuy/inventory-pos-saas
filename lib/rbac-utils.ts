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

export const MODULE_LABELS: Record<string, string> = {
  auth: 'Xác thực',
  users: 'Người dùng',
  products: 'Sản phẩm',
  inventory: 'Kho hàng',
  po: 'Nhập hàng',
  invoice: 'Hóa đơn',
  customers: 'Khách hàng',
  suppliers: 'Nhà cung cấp',
  reports: 'Báo cáo',
  notifications: 'Thông báo',
  audit: 'Nhật ký',
  settings: 'Cài đặt',
  feature_flags: 'Tính năng',
  rbac: 'Phân quyền',
};

export function getModuleLabel(module: string) {
  return MODULE_LABELS[module] ?? module;
}

export function formatPermissionAction(action: string) {
  const labels: Record<string, string> = {
    view: 'Xem',
    create: 'Tạo',
    update: 'Cập nhật',
    delete: 'Xóa',
    stock_in: 'Nhập kho',
    stock_out: 'Xuất kho',
    adjust: 'Điều chỉnh',
    rebuild: 'Tái tính',
    approve: 'Duyệt',
    receive: 'Nhận hàng',
    cancel: 'Hủy',
    refund: 'Hoàn tiền',
    apply_discount: 'Giảm giá',
    disable: 'Vô hiệu hóa',
    export: 'Xuất file',
    mark_read: 'Đánh dấu đã đọc',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    refresh: 'Làm mới token',
    '*': 'Tất cả',
  };

  return labels[action] ?? action;
}
