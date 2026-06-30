import type { ReactNode } from 'react';

import { AdminShell } from './components/AdminShell';
import { AdminThemeProvider } from './hooks/use-admin-theme';
import './admin-theme.css';

type AdminLayoutProps = {
  children: ReactNode;
};

// Codex #admin-ui start
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminThemeProvider>
      <AdminShell>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
// Codex #admin-ui end
