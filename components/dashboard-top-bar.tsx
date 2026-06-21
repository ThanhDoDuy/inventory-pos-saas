'use client';

import { LanguageSwitcher } from '@/components/language-switcher';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function DashboardTopBar() {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-end gap-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
      <NotificationBell />
      <LanguageSwitcher showLabel />
    </div>
  );
}
