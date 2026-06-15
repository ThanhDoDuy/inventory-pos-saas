'use client';

import { useCallback } from 'react';
import { useLocaleStore } from '@/lib/locale-store';
import { MESSAGES } from './messages';
import { translate } from './translate';

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const messages = MESSAGES[locale];

  const t = useCallback((key: string) => translate(messages, key), [messages]);

  return { t, locale };
}
