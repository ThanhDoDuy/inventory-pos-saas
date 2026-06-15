'use client';

import { Globe } from 'lucide-react';
import { useLocaleStore } from '@/lib/locale-store';
import type { Locale } from '@/lib/i18n/messages';
import { useTranslation } from '@/lib/i18n/use-translation';
import { cn } from '@/lib/utils';

const LOCALES: { id: Locale; label: string }[] = [
  { id: 'vi', label: 'VI' },
  { id: 'en', label: 'EN' },
];

interface LanguageSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function LanguageSwitcher({ className, showLabel = false }: LanguageSwitcherProps) {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const { t } = useTranslation();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe size={14} />
          {t('common.language')}
        </span>
      )}
      <div
        className="inline-flex rounded-lg border border-border p-0.5 bg-background"
        role="group"
        aria-label={t('common.language')}
      >
        {LOCALES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLocale(item.id)}
            className={cn(
              'min-w-[2.25rem] px-2.5 py-1 text-xs font-semibold rounded-md transition-colors',
              locale === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
            )}
            aria-pressed={locale === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
