'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { type AppRole, resolveAppRole } from '@/lib/navigation';

export function usePosRouteGuard(allowedRoles: AppRole[], fallbackHref: string) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = resolveAppRole(user);

  useEffect(() => {
    if (!allowedRoles.includes(role)) {
      router.replace(fallbackHref);
    }
  }, [allowedRoles, fallbackHref, role, router]);

  return allowedRoles.includes(role);
}
