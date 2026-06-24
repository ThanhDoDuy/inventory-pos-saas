'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  fetchNotificationLatestPage,
  useNotificationLatest,
} from '@/hooks/use-notification-latest';
import { markAllNotificationsRead, type NotificationItem } from '@/hooks/use-notifications';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { NotificationBadge } from '@/components/notifications/notification-badge';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { mergeNotificationItems } from '@/lib/notification-config';
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

  // Reset extra pages when the panel closes.
  // localItems is NOT state — it's derived via useMemo, so no need to reset it here.
  useEffect(() => {
    if (!open) {
      setExtraItems([]);
      setLoadedPage(1);
    }
  }, [open]);

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

  // Derived display list — useMemo tolerates firstPageItems being a new reference
  // every render (useNotificationLatest maps SWR data inline), unlike useEffect which
  // would loop infinitely under the same condition.
  const displayItems = useMemo(
    () => sortByCreatedDesc(mergeNotificationItems(firstPageItems, extraItems)),
    [firstPageItems, extraItems],
  );

  const hasMore = loadedPage < (pagination?.total_pages ?? 1);

  const applyOptimisticMarkAll = useCallback(() => {
    setExtraItems((prev) =>
      prev.length === 0 ? prev : prev.map((item) => ({ ...item, is_read: true })),
    );
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
