import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { StudioRouteGuard } from '@/components/auth/StudioRouteGuard';
import { SetupPasswordModal } from '@/app/(protected)/studio/components/SetupPasswordModal';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper>
      <StudioRouteGuard>
        {children}
        <SetupPasswordModal />
      </StudioRouteGuard>
    </AuthWrapper>
  );
}
