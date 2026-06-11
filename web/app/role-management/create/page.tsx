import RoleManagementPage from '../page';
import { CreateRoleModal } from './components/create-role-modal';

export default function CreateRolePage() {
  return (
    <div className="dark min-h-screen overflow-hidden bg-[#0f0f0f] text-[#ecdfe2]">
      <div className="pointer-events-none fixed inset-0 opacity-40 blur-xl">
        <RoleManagementPage />
      </div>

      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-[#0f0f0f]/60 backdrop-blur-md" />
        <CreateRoleModal />
      </div>
    </div>
  );
}
