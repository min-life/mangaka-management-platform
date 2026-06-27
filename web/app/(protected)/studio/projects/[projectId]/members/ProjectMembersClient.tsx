'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import {
  getProjectMembers,
  removeProjectMember,
  updateProjectMember,
  type ProjectMemberResponse,
} from '@/services/project.service';
import { getRoles, type RoleResponse } from '@/services/role.service';

import { AddMemberDialog } from './AddMemberDialog';
import { ChangeMemberRoleDialog } from './ChangeMemberRoleDialog';
import { DirectoryMembersTable } from './DirectoryMembersTable';
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { RemoveMemberDialog } from './RemoveMemberDialog';

type ProjectMembersClientProps = {
  projectId: number;
};

export function ProjectMembersClient({ projectId }: ProjectMembersClientProps) {
  const [members, setMembers] = useState<ProjectMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalMembers, setTotalMembers] = useState(0);
  const [projectRoles, setProjectRoles] = useState<RoleResponse[]>([]);
  const [selectedMember, setSelectedMember] = useState<ProjectMemberResponse | null>(null);
  const [roleDialogMember, setRoleDialogMember] = useState<ProjectMemberResponse | null>(null);
  const [removeDialogMember, setRemoveDialogMember] = useState<ProjectMemberResponse | null>(null);
  const [isSubmittingMemberAction, setIsSubmittingMemberAction] = useState(false);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getProjectMembers(projectId);
      setMembers(result.members);
      setTotalMembers(result.pagination?.total ?? result.members.length);
    } catch {
      setError('Unable to load project members.');
      setMembers([]);
      setTotalMembers(0);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const loadProjectRoles = useCallback(async () => {
    try {
      const roles = await getRoles('PRJ');
      setProjectRoles(roles);
    } catch {
      setProjectRoles([]);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMembers();
      void loadProjectRoles();
    });
  }, [loadMembers, loadProjectRoles]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return members;
    }

    return members.filter((member) =>
      [member.displayName ?? '', member.email, member.role.name].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [members, searchQuery]);

  const subtitle = 'Manage who belongs to this project, their role, and their task load.';

  const handleOpenRoleDialog = (member: ProjectMemberResponse) => {
    setSelectedMember(null);
    setRoleDialogMember(member);
  };

  const handleOpenRemoveDialog = (member: ProjectMemberResponse) => {
    setSelectedMember(null);
    setRemoveDialogMember(member);
  };

  const handleUpdateMemberRole = async (roleId: number) => {
    if (!roleDialogMember) {
      return;
    }

    setIsSubmittingMemberAction(true);
    setError(null);

    try {
      await updateProjectMember(projectId, roleDialogMember.id, { roleId });
      setRoleDialogMember(null);
      await loadMembers();
    } catch {
      setError('Unable to update member role.');
    } finally {
      setIsSubmittingMemberAction(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeDialogMember) {
      return;
    }

    setIsSubmittingMemberAction(true);
    setError(null);

    try {
      await removeProjectMember(projectId, removeDialogMember.id);
      setRemoveDialogMember(null);
      await loadMembers();
    } catch {
      setError('Unable to remove project member.');
    } finally {
      setIsSubmittingMemberAction(false);
    }
  };

  return (
    <section className="px-5 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-black leading-8 text-white">Project Members</h1>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <AddMemberDialog
            onAdded={() => void loadMembers()}
            projectId={projectId}
            roles={projectRoles}
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}

      <p className="mt-4 text-[11px] font-bold text-[#8b94a1]">
        * Assigned task counts use UI fallback until the member API returns task summary data.
      </p>

      <div className="mt-5 flex h-10 items-center gap-3 rounded-[4px] border border-[#39424f] bg-[#151c25] px-4 text-[#8b94a1]">
        <Search className="size-4 text-[#dce7f3]" />
        <input
          className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#8b94a1]"
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by member, role, or email..."
          value={searchQuery}
        />
      </div>

      <DirectoryMembersTable
        filteredMembers={filteredMembers}
        isLoading={isLoading}
        onChangeRole={handleOpenRoleDialog}
        onRemoveMember={handleOpenRemoveDialog}
        onViewMember={setSelectedMember}
        totalMembers={totalMembers}
      />

      <MemberDetailDrawer
        member={selectedMember}
        onChangeRole={handleOpenRoleDialog}
        onClose={() => setSelectedMember(null)}
        onRemoveMember={handleOpenRemoveDialog}
        projectId={projectId}
      />
      <ChangeMemberRoleDialog
        isSubmitting={isSubmittingMemberAction}
        member={roleDialogMember}
        onClose={() => setRoleDialogMember(null)}
        onSubmit={(roleId) => void handleUpdateMemberRole(roleId)}
        roles={projectRoles}
      />
      <RemoveMemberDialog
        isSubmitting={isSubmittingMemberAction}
        member={removeDialogMember}
        onClose={() => setRemoveDialogMember(null)}
        onConfirm={() => void handleRemoveMember()}
      />
    </section>
  );
}
