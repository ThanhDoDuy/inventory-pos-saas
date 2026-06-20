import { MESSAGES, type Locale } from './messages';
import { translateParams } from './translate';

const LOCALE_STORAGE_KEY = 'app-locale';

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'vi';

  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!raw) return 'vi';

    const parsed = JSON.parse(raw) as { state?: { locale?: string } };
    if (parsed.state?.locale === 'en' || parsed.state?.locale === 'vi') {
      return parsed.state.locale;
    }
  } catch {
    // ignore malformed storage
  }

  return 'vi';
}

export function tMessage(
  key: string,
  params?: Record<string, string | number>,
  locale?: Locale,
): string {
  const resolvedLocale = locale ?? getStoredLocale();
  return translateParams(MESSAGES[resolvedLocale], key, params);
}
