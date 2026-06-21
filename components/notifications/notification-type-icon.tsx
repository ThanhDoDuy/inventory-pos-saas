import {
  AlertTriangle,
  Bell,
  Package,
  Receipt,
  Truck,
  type LucideIcon,
} from 'lucide-react';

const TYPE_ICON_MAP: Record<string, { icon: LucideIcon; className: string }> = {
  LOW_STOCK: { icon: Package, className: 'text-amber-600 bg-amber-500/10' },
  PO_RECEIVED: { icon: Truck, className: 'text-blue-600 bg-blue-500/10' },
  INVOICE_PAID: { icon: Receipt, className: 'text-emerald-600 bg-emerald-500/10' },
};

export function NotificationTypeIcon({ type }: { type: string }) {
  const config = TYPE_ICON_MAP[type] ?? {
    icon: AlertTriangle,
    className: 'text-muted-foreground bg-secondary',
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${config.className}`}
    >
      <Icon size={18} aria-hidden />
    </span>
  );
}

export function NotificationEmptyIcon() {
  return (
    <span className="inline-flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
      <Bell size={22} aria-hidden />
    </span>
  );
}
