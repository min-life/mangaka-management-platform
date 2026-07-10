import type { ReactNode } from 'react';

import { AdminShell } from './components/AdminShell';
import './admin-theme.css';

type AdminLayoutProps = {
  children: ReactNode;
};

// Codex #admin-ui start
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-theme min-h-screen">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
// Codex #admin-ui end
