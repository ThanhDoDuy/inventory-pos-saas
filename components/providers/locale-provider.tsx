'use client';

import { useEffect } from 'react';
import { useLocaleStore } from '@/lib/locale-store';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((state) => state.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
}
