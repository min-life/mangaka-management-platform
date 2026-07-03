'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type PlatformLanguage = 'en' | 'vi';

type LanguageContextValue = {
  language: PlatformLanguage;
  setLanguage: (language: PlatformLanguage) => void;
  toggleLanguage: () => void;
};

const PLATFORM_LANGUAGE_KEY = 'mangaka:platform-language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start with the server-rendered default ('en') so the client's first
  // render matches SSR output. The stored preference (if any) is applied after
  // mount below — reading localStorage during the initial render would diverge
  // from the server and trigger a hydration mismatch.
  const [language, setLanguage] = useState<PlatformLanguage>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem(PLATFORM_LANGUAGE_KEY);
    if (stored === 'vi') {
      setLanguage('vi');
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PLATFORM_LANGUAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === 'en' ? 'vi' : 'en')),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function usePlatformLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('usePlatformLanguage must be used within a LanguageProvider.');
  }

  return context;
}
