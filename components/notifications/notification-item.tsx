'use client';

import type { NotificationItem } from '@/hooks/use-notifications';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';
import { NotificationTypeIcon } from '@/components/notifications/notification-type-icon';

function notificationTypeLabel(type: string, t: (key: string) => string): string {
  const key = `notifications.types.${type}`;
  const label = t(key);
  return label === key ? type : label;
}

interface NotificationItemRowProps {
  item: NotificationItem;
  onClick: (item: NotificationItem) => void;
}

export function NotificationItemRow({ item, onClick }: NotificationItemRowProps) {
  const { t } = useTranslation();
  const { formatRelativeTime } = useFormat();

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/70 ${
        item.is_read
          ? 'opacity-80'
          : 'bg-primary/5 border-l-2 border-l-primary'
      }`}
    >
      <NotificationTypeIcon type={item.type} />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {notificationTypeLabel(item.type, t)}
          </span>
          {!item.is_read && (
            <span className="inline-block size-1.5 rounded-full bg-primary" aria-hidden />
          )}
        </div>
        <p className={`text-sm ${item.is_read ? 'font-medium text-foreground/90' : 'font-semibold text-foreground'}`}>
          {item.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
        {item.created_at && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {formatRelativeTime(item.created_at)}
          </p>
        )}
      </div>
    </button>
  );
}
