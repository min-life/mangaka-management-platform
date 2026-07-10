import type { ReactNode } from 'react';

import { AdminAuthWrapper } from '@/components/auth/AdminAuthWrapper';
import { AdminShell } from './components/AdminShell';
import { AdminThemeProvider } from './hooks/use-admin-theme';
import './admin-theme.css';

type AdminLayoutProps = {
  children: ReactNode;
};

// Codex #admin-ui start
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthWrapper>
      <AdminThemeProvider>
        <AdminShell>{children}</AdminShell>
      </AdminThemeProvider>
    </AdminAuthWrapper>
  );
}
// Codex #admin-ui end
