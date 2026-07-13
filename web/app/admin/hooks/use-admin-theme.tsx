'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AdminTheme = 'dark' | 'light';

type AdminThemeContextValue = {
  theme: AdminTheme;
  isLightTheme: boolean;
  toggleTheme: () => void;
};

const ADMIN_THEME_STORAGE_KEY = 'mangastudio-admin-theme';

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

type AdminThemeProviderProps = {
  children: React.ReactNode;
};

export function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  const [theme, setTheme] = useState<AdminTheme>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    const storedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    return 'dark';
  });

  useEffect(() => {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<AdminThemeContextValue>(
    () => ({
      theme,
      isLightTheme: theme === 'light',
      toggleTheme: () => {
        setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
      },
    }),
    [theme],
  );

  return (
    <AdminThemeContext.Provider value={value}>
      <div className="admin-theme min-h-screen" data-admin-theme={theme}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);

  if (!context) {
    throw new Error('useAdminTheme must be used within AdminThemeProvider');
  }

  return context;
}
