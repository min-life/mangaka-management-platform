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

// Codex #admin-ui start
export function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  const [theme, setTheme] = useState<AdminTheme>('dark');

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);

    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }
  }, []);

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
// Codex #admin-ui end

// Codex #admin-ui start
export function useAdminTheme() {
  const context = useContext(AdminThemeContext);

  if (!context) {
    throw new Error('useAdminTheme must be used within AdminThemeProvider');
  }

  return context;
}
// Codex #admin-ui end
