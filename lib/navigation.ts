import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ShoppingCart,
  Building2,
  FileText,
  Package,
  Tags,
  Warehouse,
  SlidersHorizontal,
  Truck,
  ClipboardList,
  Users,
  UserCircle,
  Shield,
  Settings,
  ScrollText,
  Bell,
  BarChart3,
} from 'lucide-react';
import { PERMISSIONS } from '@/lib/permission-codes';
import {
  hasAllPermissions,
  type RolePermissionSource,
} from '@/lib/rbac-utils';

export type AppRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** User must have every listed permission (AND). */
  permissions: string[];
}

export interface NavSection {
  id: string;
  labelKey: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    labelKey: 'nav.section.overview',
    items: [
      {
        href: '/dashboard',
        labelKey: 'nav.item.dashboard',
        icon: LayoutDashboard,
        permissions: [PERMISSIONS.REPORTS_VIEW],
      },
      {
        href: '/dashboard/reports',
        labelKey: 'nav.item.reports',
        icon: BarChart3,
        permissions: [PERMISSIONS.REPORTS_VIEW],
      },
    ],
  },
  {
    id: 'sales',
    labelKey: 'nav.section.sales',
    items: [
      {
        href: '/dashboard/pos',
        labelKey: 'nav.item.posRetail',
        icon: ShoppingCart,
        permissions: [PERMISSIONS.INVOICE_CREATE],
      },
      {
        href: '/dashboard/pos/business',
        labelKey: 'nav.item.posBusiness',
        icon: Building2,
        permissions: [PERMISSIONS.INVOICE_CREATE, PERMISSIONS.CUSTOMERS_VIEW],
      },
      {
        href: '/dashboard/invoices',
        labelKey: 'nav.item.invoices',
        icon: FileText,
        permissions: [PERMISSIONS.INVOICE_VIEW],
      },
      {
        href: '/dashboard/customers',
        labelKey: 'nav.item.customers',
        icon: UserCircle,
        permissions: [PERMISSIONS.CUSTOMERS_VIEW],
      },
    ],
  },
  {
    id: 'warehouse',
    labelKey: 'nav.section.warehouse',
    items: [
      {
        href: '/dashboard/products',
        labelKey: 'nav.item.products',
        icon: Package,
        permissions: [PERMISSIONS.PRODUCTS_VIEW],
      },
      {
        href: '/dashboard/categories',
        labelKey: 'nav.item.categories',
        icon: Tags,
        permissions: [PERMISSIONS.PRODUCTS_VIEW],
      },
      {
        href: '/dashboard/inventory',
        labelKey: 'nav.item.inventory',
        icon: Warehouse,
        permissions: [PERMISSIONS.INVENTORY_VIEW],
      },
      {
        href: '/dashboard/inventory/adjustments',
        labelKey: 'nav.item.adjustments',
        icon: SlidersHorizontal,
        permissions: [PERMISSIONS.INVENTORY_ADJUST],
      },
    ],
  },
  {
    id: 'procurement',
    labelKey: 'nav.section.procurement',
    items: [
      {
        href: '/dashboard/suppliers',
        labelKey: 'nav.item.suppliers',
        icon: Truck,
        permissions: [PERMISSIONS.SUPPLIERS_VIEW],
      },
      {
        href: '/dashboard/purchase-orders',
        labelKey: 'nav.item.purchaseOrders',
        icon: ClipboardList,
        permissions: [PERMISSIONS.PO_VIEW],
      },
    ],
  },
  {
    id: 'system',
    labelKey: 'nav.section.system',
    items: [
      {
        href: '/dashboard/users',
        labelKey: 'nav.item.users',
        icon: Users,
        permissions: [PERMISSIONS.USERS_VIEW],
      },
      {
        href: '/dashboard/rbac',
        labelKey: 'nav.item.rbac',
        icon: Shield,
        permissions: [PERMISSIONS.RBAC_VIEW],
      },
      {
        href: '/dashboard/settings',
        labelKey: 'nav.item.settings',
        icon: Settings,
        permissions: [PERMISSIONS.SETTINGS_VIEW],
      },
      {
        href: '/dashboard/audit-logs',
        labelKey: 'nav.item.auditLogs',
        icon: ScrollText,
        permissions: [PERMISSIONS.AUDIT_VIEW],
      },
      {
        href: '/dashboard/notifications',
        labelKey: 'nav.item.notifications',
        icon: Bell,
        permissions: [PERMISSIONS.NOTIFICATIONS_VIEW],
      },
    ],
  },
];

export function resolveAppRole(user: { role?: { code?: string } } | null | undefined): AppRole {
  const code = user?.role?.code?.toUpperCase();
  if (code === 'ADMIN' || code === 'MANAGER' || code === 'STAFF') {
    return code;
  }
  return 'STAFF';
}

export function canAccessNavItem(
  item: NavItem,
  source: RolePermissionSource,
): boolean {
  return hasAllPermissions(source, item.permissions);
}

export function getVisibleNavSections(
  source: RolePermissionSource,
): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccessNavItem(item, source)),
  })).filter((section) => section.items.length > 0);
}

export function findNavItemForPath(pathname: string): NavItem | null {
  let bestMatch: NavItem | null = null;
  let bestLength = -1;

  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (!isNavActive(pathname, item.href)) continue;
      if (item.href.length > bestLength) {
        bestMatch = item;
        bestLength = item.href.length;
      }
    }
  }

  return bestMatch;
}

export function getFirstAccessibleHref(source: RolePermissionSource): string | null {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (canAccessNavItem(item, source)) {
        return item.href;
      }
    }
  }
  return null;
}

export function isNavActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === href;
  }
  if (href === '/dashboard/pos') {
    return pathname === href;
  }
  if (href === '/dashboard/inventory') {
    return (
      pathname === href ||
      (pathname.startsWith('/dashboard/inventory/') &&
        !pathname.startsWith('/dashboard/inventory/adjustments'))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveSectionId(
  pathname: string,
  sections: NavSection[],
): string | null {
  for (const section of sections) {
    if (section.items.some((item) => isNavActive(pathname, item.href))) {
      return section.id;
    }
  }
  return null;
}
