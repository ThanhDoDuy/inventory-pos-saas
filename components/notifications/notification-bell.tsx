'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  fetchNotificationLatestPage,
  useNotificationLatest,
} from '@/hooks/use-notification-latest';
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/hooks/use-notifications';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { NotificationBadge } from '@/components/notifications/notification-badge';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { mergeNotificationItems, resolveNotificationRedirectUrl } from '@/lib/notification-config';
import { PERMISSIONS } from '@/lib/permission-codes';
import { useTranslation } from '@/lib/i18n/use-translation';

function sortByCreatedDesc(items: NotificationItem[]) {
  return [...items].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function NotificationBell() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hasPermission } = useUserPermissions();
  const canView = hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW);
  const canMarkRead = hasPermission(PERMISSIONS.NOTIFICATIONS_MARK_READ);

  const {
    items: firstPageItems,
    unreadCount,
    pagination,
    isLoading,
    mutate,
  } = useNotificationLatest(canView);

  const [open, setOpen] = useState(false);
  const [extraItems, setExtraItems] = useState<NotificationItem[]>([]);
  const [loadedPage, setLoadedPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [localItems, setLocalItems] = useState<NotificationItem[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setPulse(true);
      const timer = window.setTimeout(() => setPulse(false), 1200);
      return () => window.clearTimeout(timer);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!open) {
      setExtraItems([]);
      setLoadedPage(1);
      setLocalItems([]);
      return;
    }
    setLocalItems(sortByCreatedDesc(mergeNotificationItems(firstPageItems, extraItems)));
  }, [open, firstPageItems, extraItems]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const displayItems = open
    ? localItems
    : sortByCreatedDesc(firstPageItems);

  const hasMore = loadedPage < (pagination?.total_pages ?? 1);

  const applyOptimisticRead = useCallback(
    (id: string) => {
      setLocalItems((items) =>
        items.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
      );
      void mutate(
        (current) => {
          if (!current) return current;
          const wasUnread = current.items.some(
            (raw) => String(raw._id ?? raw.id) === id && !raw.is_read,
          );
          return {
            ...current,
            unread_count: wasUnread
              ? Math.max(0, current.unread_count - 1)
              : current.unread_count,
            items: current.items.map((raw) =>
              String(raw._id ?? raw.id) === id
                ? { ...raw, is_read: true, read_at: new Date().toISOString() }
                : raw,
            ),
          };
        },
        { revalidate: false },
      );
    },
    [mutate],
  );

  const applyOptimisticMarkAll = useCallback(() => {
    setLocalItems((items) => items.map((item) => ({ ...item, is_read: true })));
    void mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          unread_count: 0,
          items: current.items.map((raw) => ({
            ...raw,
            is_read: true,
            read_at: new Date().toISOString(),
          })),
        };
      },
      { revalidate: false },
    );
  }, [mutate]);

  const handleItemClick = async (item: NotificationItem) => {
    const href = resolveNotificationRedirectUrl(
      item.redirect_url,
      item.type,
      item.payload,
    );

    if (!item.is_read && canMarkRead) {
      applyOptimisticRead(item.id);
      try {
        await markNotificationRead(item.id);
        void mutate();
      } catch {
        void mutate();
      }
    }

    setOpen(false);

    if (href) {
      router.push(href);
    }
  };

  const handleMarkAllRead = async () => {
    if (!canMarkRead || unreadCount === 0) return;
    setIsMarkingAll(true);
    applyOptimisticMarkAll();
    try {
      await markAllNotificationsRead();
      void mutate();
    } catch {
      void mutate();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = loadedPage + 1;
      const result = await fetchNotificationLatestPage(nextPage);
      setExtraItems((prev) => mergeNotificationItems(prev, result.items));
      setLoadedPage(nextPage);
      setLocalItems((prev) =>
        sortByCreatedDesc(mergeNotificationItems(prev, result.items)),
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const ariaLabel = useMemo(() => {
    if (unreadCount > 0) {
      return t('notifications.navbar.ariaLabelWithCount', { count: unreadCount });
    }
    return t('notifications.navbar.ariaLabel');
  }, [t, unreadCount]);

  if (!canView) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-secondary"
      >
        <Bell
          size={18}
          className={pulse ? 'animate-pulse text-primary' : undefined}
          aria-hidden
        />
        <NotificationBadge count={unreadCount} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" aria-hidden onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
            <NotificationPanel
              variant="sheet"
              items={displayItems}
              unreadCount={unreadCount}
              hasMore={hasMore}
              isLoading={isLoading}
              isLoadingMore={loadingMore}
              canMarkRead={canMarkRead}
              isMarkingAll={isMarkingAll}
              onItemClick={handleItemClick}
              onMarkAllRead={handleMarkAllRead}
              onLoadMore={handleLoadMore}
              onClose={() => setOpen(false)}
            />
          </div>

          <div className="absolute right-0 top-full z-50 mt-2 hidden md:block">
            <NotificationPanel
              variant="dropdown"
              items={displayItems}
              unreadCount={unreadCount}
              hasMore={hasMore}
              isLoading={isLoading}
              isLoadingMore={loadingMore}
              canMarkRead={canMarkRead}
              isMarkingAll={isMarkingAll}
              onItemClick={handleItemClick}
              onMarkAllRead={handleMarkAllRead}
              onLoadMore={handleLoadMore}
              onClose={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
