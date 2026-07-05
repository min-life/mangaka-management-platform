import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthWrapper>{children}</AuthWrapper>;
}
