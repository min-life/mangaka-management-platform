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

function getInitialLanguage(): PlatformLanguage {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return window.localStorage.getItem(PLATFORM_LANGUAGE_KEY) === 'vi' ? 'vi' : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<PlatformLanguage>(getInitialLanguage);

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
