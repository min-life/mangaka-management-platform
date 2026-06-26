import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthWrapper>{children}</AuthWrapper>
    </AuthProvider>
  );
}
