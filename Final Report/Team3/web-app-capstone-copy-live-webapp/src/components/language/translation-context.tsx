'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { getMessage } from './languages/i18n';
import type { Locale } from './languages/i18n';

interface TranslationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextValue>({
  locale: 'en',
  setLocale: () => { },
  t: (key) => key,
});

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  // Load saved locale on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('locale');
    if (stored === 'en' || stored === 'es') {
      setLocale(stored as Locale);
    }
  }, []);

  // Persist locale whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('locale', locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string) => getMessage(locale, key),
    }),
    [locale]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextValue {
  return useContext(TranslationContext);
}
