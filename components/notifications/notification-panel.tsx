'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { NotificationItem } from '@/hooks/use-notifications';
import { NotificationEmptyIcon } from '@/components/notifications/notification-type-icon';
import { NotificationItemRow } from '@/components/notifications/notification-item';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/use-translation';

interface NotificationPanelProps {
  items: NotificationItem[];
  unreadCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  canMarkRead: boolean;
  isMarkingAll: boolean;
  onItemClick: (item: NotificationItem) => void;
  onMarkAllRead: () => void;
  onLoadMore: () => void;
  onClose?: () => void;
  variant?: 'dropdown' | 'sheet';
}

export function NotificationPanel({
  items,
  unreadCount,
  hasMore,
  isLoading,
  isLoadingMore,
  canMarkRead,
  isMarkingAll,
  onItemClick,
  onMarkAllRead,
  onLoadMore,
  onClose,
  variant = 'dropdown',
}: NotificationPanelProps) {
  const { t } = useTranslation();
  const isSheet = variant === 'sheet';

  return (
    <div
      className={
        isSheet
          ? 'flex h-full max-h-[85vh] flex-col bg-card'
          : 'flex max-h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg ring-1 ring-border/60'
      }
      role="dialog"
      aria-label={t('notifications.navbar.title')}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t('notifications.navbar.title')}
          </h2>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('notifications.unreadCount', { count: unreadCount })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canMarkRead && unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={isMarkingAll}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              {t('notifications.navbar.markAllRead')}
            </button>
          )}
          {isSheet && onClose && (
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {t('notifications.navbar.close')}
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={18} />
            {t('notifications.navbar.loading')}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <NotificationEmptyIcon />
            <p className="text-sm text-muted-foreground">{t('notifications.navbar.empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {items.map((item) => (
              <NotificationItemRow key={item.id} item={item} onClick={onItemClick} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3 space-y-2">
        {hasMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                {t('notifications.navbar.loading')}
              </>
            ) : (
              t('notifications.navbar.viewMore')
            )}
          </Button>
        )}
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="block text-center text-sm font-medium text-primary hover:underline"
        >
          {t('notifications.navbar.viewAll')}
        </Link>
      </div>
    </div>
  );
}
