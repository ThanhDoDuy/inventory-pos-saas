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
  label: string;
  icon: LucideIcon;
  roles: AppRole[];
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        href: '/dashboard/reports',
        label: 'Báo cáo',
        icon: BarChart3,
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    id: 'sales',
    label: 'Bán hàng',
    items: [
      {
        href: '/dashboard/pos',
        label: 'POS',
        icon: ShoppingCart,
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
      },
      {
        href: '/dashboard/invoices',
        label: 'Hóa đơn',
        icon: FileText,
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
      },
      {
        href: '/dashboard/customers',
        label: 'Khách hàng',
        icon: UserCircle,
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    id: 'warehouse',
    label: 'Kho hàng',
    items: [
      {
        href: '/dashboard/products',
        label: 'Sản phẩm',
        icon: Package,
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
      },
      {
        href: '/dashboard/categories',
        label: 'Danh mục',
        icon: Tags,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        href: '/dashboard/inventory',
        label: 'Tồn kho',
        icon: Warehouse,
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
      },
      {
        href: '/dashboard/inventory/adjustments',
        label: 'Điều chỉnh kho',
        icon: SlidersHorizontal,
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    id: 'procurement',
    label: 'Mua hàng',
    items: [
      {
        href: '/dashboard/suppliers',
        label: 'Nhà cung cấp',
        icon: Truck,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        href: '/dashboard/purchase-orders',
        label: 'Nhập hàng',
        icon: ClipboardList,
        roles: ['ADMIN', 'MANAGER', 'STAFF'],
      },
    ],
  },
  {
    id: 'system',
    label: 'Hệ thống',
    items: [
      {
        href: '/dashboard/users',
        label: 'Người dùng',
        icon: Users,
        roles: ['ADMIN'],
      },
      {
        href: '/dashboard/rbac',
        label: 'Vai trò & Quyền',
        icon: Shield,
        roles: ['ADMIN'],
      },
      {
        href: '/dashboard/settings',
        label: 'Cài đặt',
        icon: Settings,
        roles: ['ADMIN'],
      },
      {
        href: '/dashboard/audit-logs',
        label: 'Nhật ký audit',
        icon: ScrollText,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        href: '/dashboard/notifications',
        label: 'Thông báo',
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
