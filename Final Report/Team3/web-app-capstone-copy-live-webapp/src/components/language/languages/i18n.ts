import en from './en.json';
import es from './es.json';

export type Locale = 'en' | 'es';

const FALLBACK_LOCALE: Locale = 'en';

const STATIC_MESSAGES = {
  en: en as Record<string, string>,
  es: es as Record<string, string>,
};

export function resolveLocaleFromPath(pathname?: string | null): Locale {
  if (!pathname) return 'en';
  if (pathname.startsWith('/es')) return 'es';
  return 'en';
}

export function getMessage(locale: Locale, key: string): string {
  const messages = STATIC_MESSAGES[locale] || STATIC_MESSAGES[FALLBACK_LOCALE];
  return messages[key] ?? STATIC_MESSAGES[FALLBACK_LOCALE][key] ?? key;
}
