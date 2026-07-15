'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import {
  removeProjectMember,
  updateProjectMember,
  type ProjectMemberResponse,
} from '@/services/project.service';
import { toast } from '@/lib/toast';

import { LoadingState } from '@/components/ui/loading-state';

import { AddMemberDialog } from './AddMemberDialog';
import { ChangeMemberRoleDialog } from './ChangeMemberRoleDialog';
import { DirectoryMembersTable } from './DirectoryMembersTable';
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/hooks/useAuth';

import { useProjectParams } from '@/hooks/useProjectParams';
import {
  useProjectStore,
  selectProject,
  selectMembers,
} from '../../store/project-store';

export function ProjectMembersClient() {
  const { user: currentUser } = useAuth();
  const { numericId: projectId } = useProjectParams();
  const { can: canProject } = usePermissions({ resource: 'PROJECT', resourceId: projectId });

  // ── Store ─────────────────────────────────────────────────────────────────
  const { loadProject, loadMembers, loadProjectRoles, upsertMember, removeMember, projectRoles } =
    useProjectStore();
  const projectState = useProjectStore(selectProject(projectId));
  const membersState = useProjectStore(selectMembers(projectId));

  const project = projectState.data;
  const members = membersState.list;
  const isLoading = membersState.isLoading || !membersState.loaded;
  const error = membersState.error;

  // ── Local UI state ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedMember, setSelectedMember] = useState<ProjectMemberResponse | null>(null);
  const [roleDialogMember, setRoleDialogMember] = useState<ProjectMemberResponse | null>(null);
  const [removeDialogMember, setRemoveDialogMember] = useState<ProjectMemberResponse | null>(null);
  const [isSubmittingMemberAction, setIsSubmittingMemberAction] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    void loadProject(projectId);
    void loadMembers(projectId);
    void loadProjectRoles();
  }, [projectId, loadProject, loadMembers, loadProjectRoles]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const mappedMembers = members.map((member) => {
      const isOwner =
        project &&
        (project.createdBy === member.id || project.createdByUser?.id === member.id);
      if (isOwner) {
        return {
          ...member,
          role: {
            ...member.role,
            name: 'Owner',
          },
        };
      }
      return member;
    });

    if (!normalizedQuery) {
      return mappedMembers;
    }

    return mappedMembers.filter((member) =>
      [member.displayName ?? '', member.email, member.role.name].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [members, searchQuery, project]);

  const paginatedMembers = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredMembers.slice(startIndex, startIndex + limit);
  }, [filteredMembers, page, limit]);

  const totalPages = Math.ceil(filteredMembers.length / limit);

  const isProjectOwner = !!(
    project &&
    (project.createdBy === currentUser?.id || project.createdByUser?.id === currentUser?.id)
  );
  const canAddMember =
    canProject('project:member.add') ||
    canProject('admin') ||
    canProject('project:owner') ||
    isProjectOwner;
  const canUpdateMember =
    canProject('project:member.update') ||
    canProject('admin') ||
    canProject('project:owner') ||
    isProjectOwner;
  const canRemoveMember =
    canProject('project:member.remove') ||
    canProject('admin') ||
    canProject('project:owner') ||
    isProjectOwner;

  const subtitle = 'Manage project access and roles for this production workspace.';

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenRoleDialog = (member: ProjectMemberResponse) => {
    setSelectedMember(null);
    setRoleDialogMember(member);
  };

  const handleOpenRemoveDialog = (member: ProjectMemberResponse) => {
    setSelectedMember(null);
    setRemoveDialogMember(member);
  };

  const handleUpdateMemberRole = async (roleId: number) => {
    if (!roleDialogMember) return;

    setIsSubmittingMemberAction(true);

    try {
      const updated = await updateProjectMember(projectId, roleDialogMember.id, { roleId });
      setRoleDialogMember(null);
      // Optimistic update — re-fetch to ensure correctness
      await loadMembers(projectId, true);
      toast.success('Role updated.');
    } catch {
      toast.error('Failed to update role. Please try again.');
    } finally {
      setIsSubmittingMemberAction(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeDialogMember) return;

    setIsSubmittingMemberAction(true);

    try {
      await removeProjectMember(projectId, removeDialogMember.id);
      setRemoveDialogMember(null);
      removeMember(projectId, removeDialogMember.id); // Optimistic remove
      await loadMembers(projectId, true);             // Then sync with server
      toast.success('Member removed.');
    } catch {
      toast.error('Failed to remove member. Please try again.');
    } finally {
      setIsSubmittingMemberAction(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="px-5 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-black leading-8 text-white">Project Members</h1>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {canAddMember && (
            <AddMemberDialog
              onAdded={() => void loadMembers(projectId, true)}
              projectId={projectId}
              roles={projectRoles}
            />
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}

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
        filteredMembers={paginatedMembers}
        isLoading={isLoading}
        onChangeRole={handleOpenRoleDialog}
        onRemoveMember={handleOpenRemoveDialog}
        canUpdateMember={canUpdateMember}
        canRemoveMember={canRemoveMember}
        onViewMember={setSelectedMember}
        totalMembers={filteredMembers.length}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        visibleCount={paginatedMembers.length}
      />

      <MemberDetailDrawer
        member={selectedMember}
        onChangeRole={handleOpenRoleDialog}
        onRemoveMember={handleOpenRemoveDialog}
        canUpdateMember={canUpdateMember}
        canRemoveMember={canRemoveMember}
        onClose={() => setSelectedMember(null)}
        projectId={projectId}
        project={project}
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
