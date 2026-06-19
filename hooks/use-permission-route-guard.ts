'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserPermissions } from '@/hooks/use-user-permissions';

export function usePermissionRouteGuard(
  requiredPermissions: string[],
  fallbackHref: string,
) {
  const router = useRouter();
  const { hasAllPermissions, isLoading } = useUserPermissions();
  const allowed = !isLoading && hasAllPermissions(requiredPermissions);

  useEffect(() => {
    if (isLoading) return;
    if (!hasAllPermissions(requiredPermissions)) {
      router.replace(fallbackHref);
    }
  }, [fallbackHref, hasAllPermissions, isLoading, requiredPermissions, router]);

  return allowed;
}
