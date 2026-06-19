'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
  const { permissionSource, isLoading } = useUserPermissions();

  useEffect(() => {
    if (isLoading) return;

    const navItem = findNavItemForPath(pathname);
    if (!navItem) return;

    if (!canAccessNavItem(navItem, permissionSource)) {
      const fallback = getFirstAccessibleHref(permissionSource) ?? '/login';
      router.replace(fallback);
    }
  }, [isLoading, pathname, permissionSource, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={20} />
        {t('common.loading')}
      </div>
    );
  }

  return <>{children}</>;
}
