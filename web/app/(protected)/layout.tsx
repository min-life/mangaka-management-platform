import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { SetupPasswordModal } from '@/app/(protected)/studio/components/SetupPasswordModal';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper>
      {children}
      <SetupPasswordModal />
    </AuthWrapper>
  );
}
