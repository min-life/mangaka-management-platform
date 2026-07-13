import { Suspense } from 'react';
import AdminUsersClient from './components/AdminUsersClient';

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsersClient />
    </Suspense>
  );
}
