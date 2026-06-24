'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useTranslation } from '@/lib/i18n/use-translation';

// Shared promise so concurrent AuthGuard mounts (e.g. during hot-reload or
// React Strict Mode double-invoke) don't fire duplicate /auth/profile calls.
let hydratePromise: Promise<void> | null = null;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydratePromise) {
      hydratePromise = checkAuth().finally(() => {
        hydratePromise = null;
        setReady(true);
      });
    } else {
      hydratePromise.finally(() => setReady(true));
    }
  }, [checkAuth]);

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/login');
    }
  }, [ready, isAuthenticated, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
