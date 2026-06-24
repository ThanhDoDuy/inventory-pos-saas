'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import {
  canAccessNavItem,
  findNavItemForPath,
  getFirstAccessibleHref,
} from '@/lib/navigation';
import { useTranslation } from '@/lib/i18n/use-translation';

export function PermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { permissionSource, isLoading, error, mutate } = useUserPermissions();

  useEffect(() => {
    if (isLoading || error) return;

    const navItem = findNavItemForPath(pathname);
    if (!navItem) return;

    if (!canAccessNavItem(navItem, permissionSource)) {
      const fallback = getFirstAccessibleHref(permissionSource);
      if (!fallback || fallback === pathname) {
        router.replace('/login');
        return;
      }
      router.replace(fallback);
    }
  }, [isLoading, error, pathname, permissionSource, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={20} />
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <AlertTriangle size={24} className="text-destructive" />
        <p className="text-sm">{t('common.permissionsLoadError')}</p>
        <button
          onClick={() => mutate()}
          className="text-sm text-primary underline underline-offset-2"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
