import type { ReactNode } from 'react';

import { AdminAuthWrapper } from '@/components/auth/AdminAuthWrapper';
import { AdminShell } from './components/AdminShell';
import './admin-theme.css';

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthWrapper>
      <div className="min-h-screen admin-theme">
        <AdminShell>{children}</AdminShell>
      </div>
    </AdminAuthWrapper>
  );
}
