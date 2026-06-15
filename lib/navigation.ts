import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ShoppingCart,
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

export type AppRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  roles: AppRole[];
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
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        href: '/dashboard/reports',
        labelKey: 'nav.item.reports',
        icon: BarChart3,
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    id: 'sales',
    labelKey: 'nav.section.sales',
    items: [
      {
        href: '/dashboard/pos',
        labelKey: 'nav.item.pos',
        icon: ShoppingCart,
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
      },
      {
        href: '/dashboard/invoices',
        labelKey: 'nav.item.invoices',
        icon: FileText,
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
      },
      {
        href: '/dashboard/customers',
        labelKey: 'nav.item.customers',
        icon: UserCircle,
        roles: ['ADMIN', 'MANAGER'],
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
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
      },
      {
        href: '/dashboard/categories',
        labelKey: 'nav.item.categories',
        icon: Tags,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        href: '/dashboard/inventory',
        labelKey: 'nav.item.inventory',
        icon: Warehouse,
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
      },
      {
        href: '/dashboard/inventory/adjustments',
        labelKey: 'nav.item.adjustments',
        icon: SlidersHorizontal,
        roles: ['ADMIN', 'MANAGER'],
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
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        href: '/dashboard/purchase-orders',
        labelKey: 'nav.item.purchaseOrders',
        icon: ClipboardList,
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
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
        roles: ['ADMIN'],
      },
      {
        href: '/dashboard/rbac',
        labelKey: 'nav.item.rbac',
        icon: Shield,
        roles: ['ADMIN'],
      },
      {
        href: '/dashboard/settings',
        labelKey: 'nav.item.settings',
        icon: Settings,
        roles: ['ADMIN'],
      },
      {
        href: '/dashboard/audit-logs',
        labelKey: 'nav.item.auditLogs',
        icon: ScrollText,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        href: '/dashboard/notifications',
        labelKey: 'nav.item.notifications',
        icon: Bell,
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
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

export function getVisibleNavSections(role: AppRole): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}

export function isNavActive(pathname: string, href: string) {
  if (href === '/dashboard') {
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
