'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import {
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_TYPES,
  useNotifications,
  type NotificationItem,
} from '@/hooks/use-notifications';
import { FormField, selectClassName } from '@/components/form-field';
import { PaginationBar } from '@/components/pagination-bar';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

function notificationTypeLabel(
  type: string,
  t: (key: string) => string,
): string {
  if (type === 'LOW_STOCK') return t('notifications.types.LOW_STOCK');
  if (type === 'PO_RECEIVED') return t('notifications.types.PO_RECEIVED');
  if (type === 'INVOICE_PAID') return t('notifications.types.INVOICE_PAID');
  return type;
}

function NotificationCard({
  item,
  onMarkRead,
  isMarking,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  isMarking: boolean;
}) {
  const { t } = useTranslation();
  const { formatDateTime } = useFormat();

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        item.is_read
          ? 'border-border bg-card'
          : 'border-primary/30 bg-primary/5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {notificationTypeLabel(item.type, t)}
            </span>
            {!item.is_read && (
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
          <p className="font-semibold text-foreground">{item.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
          {item.created_at && (
            <p className="text-xs text-muted-foreground mt-2">
              {formatDateTime(item.created_at)}
            </p>
          )}
        </div>
        {!item.is_read && (
          <button
            type="button"
            onClick={() => onMarkRead(item.id)}
            disabled={isMarking}
            className="shrink-0 text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            {t('notifications.markRead')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isMarking, setIsMarking] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [readFilter, typeFilter]);

  const { notifications, unreadCount, pagination, isLoading, error, mutate } = useNotifications({
    unread: readFilter === 'unread',
    type: typeFilter,
    page,
  });

  const handleMarkRead = async (id: string) => {
    setIsMarking(true);
    try {
      await markNotificationRead(id);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('notifications.error.markReadFailed'));
    } finally {
      setIsMarking(false);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarking(true);
    try {
      await markAllNotificationsRead();
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('notifications.error.markAllFailed'));
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('notifications.title')}</h1>
          <p className="text-muted-foreground">{t('notifications.description')}</p>
          {unreadCount > 0 && (
            <p className="text-sm font-medium text-primary mt-2">
              {t('notifications.unreadCount', { count: unreadCount })}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarking}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isMarking ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <CheckCheck size={18} />
            )}
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
          <FormField label={t('notifications.filter.show')} htmlFor="notif-read">
            <select
              id="notif-read"
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as 'all' | 'unread')}
              className={selectClassName}
            >
              <option value="all">{t('notifications.filter.all')}</option>
              <option value="unread">{t('notifications.filter.unread')}</option>
            </select>
          </FormField>
          <FormField label={t('notifications.filter.type')} htmlFor="notif-type">
            <select
              id="notif-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="all">{t('notifications.filter.all')}</option>
              {NOTIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {notificationTypeLabel(type, t)}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="space-y-3 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground bg-card rounded-lg border border-border">
            <Loader2 className="animate-spin" size={20} />
            {t('common.loading')}
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive bg-card rounded-lg border border-border">
            {t('notifications.error.loadFailed')}
          </p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
            <Bell className="mx-auto mb-2 opacity-50" size={32} />
            {readFilter === 'unread'
              ? t('notifications.empty.unread')
              : t('notifications.empty.all')}
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onMarkRead={handleMarkRead}
              isMarking={isMarking}
            />
          ))
        )}
        </div>
        <PaginationBar pagination={pagination} onPageChange={setPage} isLoading={isLoading} />
      </div>
    </div>
  );
}
