/** Mirror of backend permission.constants.ts — used for nav and route guards. */
export const PERMISSIONS = {
  REPORTS_VIEW: 'reports:view',
  INVOICE_CREATE: 'invoice:create',
  INVOICE_VIEW: 'invoice:view',
  CUSTOMERS_VIEW: 'customers:view',
  PRODUCTS_VIEW: 'products:view',
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_ADJUST: 'inventory:adjust',
  SUPPLIERS_VIEW: 'suppliers:view',
  PO_VIEW: 'po:view',
  USERS_VIEW: 'users:view',
  RBAC_VIEW: 'rbac:view',
  SETTINGS_VIEW: 'settings:view',
  AUDIT_VIEW: 'audit:view',
  NOTIFICATIONS_VIEW: 'notifications:view',
  NOTIFICATIONS_MARK_READ: 'notifications:mark_read',
} as const;
