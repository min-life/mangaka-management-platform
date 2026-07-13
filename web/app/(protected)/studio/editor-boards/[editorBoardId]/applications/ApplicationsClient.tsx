'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, FileText, FolderPlus, Search, Send, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  type ApplicationResponse,
  type ApplicationStatus,
  updateApplicationStatus,
} from '@/services/application.service';

import {
  getEditorBoardApplicationsCacheKey,
  useEditorBoardStore,
} from '../../store/editor-board-store';
import { getEditorBoardApiErrorMessage } from '../../utils/api-error';

import { ApplicationReviewDrawer } from './ApplicationReviewDrawer';
import { getApplicationTypeLabel, getStatusLabel, getStatusStyle } from './application-ui';

type ApplicationsClientProps = {
  editorBoardId: number;
};

export type EditorBoardApplicationStatus = ApplicationStatus | 'SUBMITTED';

export type EditorBoardApplicationType =
  'CREATE_ARC' | 'CREATE_CHAPTER' | 'MANUSCRIPT_REVIEW' | 'PUBLISH_REQUEST';

export type EditorBoardApplicationResponse = Omit<ApplicationResponse, 'status' | 'type'> & {
  parentFolderId?: number | null;
  folderImageUrl?: string | null;
  status: EditorBoardApplicationStatus;
  type: EditorBoardApplicationType;
};

const STATUS_FILTERS = ['ALL', 'SUBMITTED', 'APPROVE', 'REJECT'] as const;

const TYPE_FILTERS = ['ALL', 'CREATE_ARC', 'CREATE_CHAPTER'] as const;

const APPLICATION_PAGE_SIZE = 10;

const EMPTY_PERMISSIONS: string[] = [];

const APPLICATION_TYPE_ICONS: Record<EditorBoardApplicationType, LucideIcon> = {
  CREATE_ARC: FolderPlus,
  CREATE_CHAPTER: BookOpen,
  MANUSCRIPT_REVIEW: FileText,
  PUBLISH_REQUEST: Send,
};

type ApplicationDetailResponse = {
  data?: EditorBoardApplicationResponse;
};

async function getApplicationDetails(applicationId: number | string) {
  const response = await api.get<ApplicationDetailResponse, ApplicationDetailResponse>(
    `/applications/${applicationId}`,
  );

  return response.data ?? (response as EditorBoardApplicationResponse);
}

// PhucTD #editor-board start
export function ApplicationsClient({ editorBoardId }: ApplicationsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<EditorBoardApplicationResponse | null>(null);
  const applicationsCacheKey = getEditorBoardApplicationsCacheKey(editorBoardId, searchQuery);
  const applicationPage = useEditorBoardStore(
    (state) => state.applicationPages[applicationsCacheKey],
  );
  const loadApplicationsPage = useEditorBoardStore((state) => state.loadApplicationsPage);
  const loadBoardPermissions = useEditorBoardStore((state) => state.loadBoardPermissions);
  const permissions = useEditorBoardStore(
    (state) => state.boardPermissions[String(editorBoardId)] ?? EMPTY_PERMISSIONS,
  );
  const applications = useMemo(
    () => (applicationPage?.applications ?? []) as EditorBoardApplicationResponse[],
    [applicationPage?.applications],
  );
  const error = applicationPage?.error ?? null;
  const isLoading = applicationPage?.isLoading ?? !applicationPage?.loaded;
  const isLoadingMore = applicationPage?.isLoadingMore ?? false;
  const pagination = applicationPage?.pagination ?? null;

  // Derived permission flags
  const canApprove =
    permissions.includes('admin') ||
    permissions.includes('board:owner') ||
    permissions.includes('board:leader') ||
    permissions.includes('board:application.approve');

  const loadApplications = useCallback(async () => {
    await loadApplicationsPage(editorBoardId, {
      limit: APPLICATION_PAGE_SIZE,
      mode: 'replace',
      page: 1,
      search: searchQuery,
    });
  }, [editorBoardId, loadApplicationsPage, searchQuery]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadBoardPermissions(editorBoardId);
    });
  }, [editorBoardId, loadBoardPermissions]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadApplications();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadApplications]);

  const hasMoreApplications = Boolean(pagination && pagination.page < pagination.totalPages);

  const loadNextApplicationsPage = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMoreApplications || !pagination) {
      return;
    }

    void loadApplicationsPage(editorBoardId, {
      limit: APPLICATION_PAGE_SIZE,
      mode: 'append',
      page: pagination.page + 1,
      search: searchQuery,
    });
  }, [
    editorBoardId,
    hasMoreApplications,
    isLoading,
    isLoadingMore,
    loadApplicationsPage,
    pagination,
    searchQuery,
  ]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadNextApplicationsPage();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [loadNextApplicationsPage]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || application.type === typeFilter;
      const matchesSearch =
        !normalizedQuery ||
        [application.title, application.project?.name, application.status]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [applications, searchQuery, statusFilter, typeFilter]);

  const handleUpdateStatus = async (
    application: EditorBoardApplicationResponse,
    status: ApplicationStatus,
  ) => {
    setIsSubmitting(true);

    try {
      await updateApplicationStatus(application.id, status);
      setSelectedApplication((current) =>
        current?.id === application.id
          ? { ...current, status, updatedAt: new Date().toISOString() }
          : current,
      );
      await loadApplicationsPage(editorBoardId, {
        force: true,
        limit: APPLICATION_PAGE_SIZE,
        mode: 'replace',
        page: 1,
        search: searchQuery,
      });
    } catch (error) {
      toast.error(getEditorBoardApiErrorMessage(error, 'Unable to update application status.'));
      await loadApplicationsPage(editorBoardId, {
        force: true,
        limit: APPLICATION_PAGE_SIZE,
        mode: 'replace',
        page: 1,
        search: searchQuery,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenApplication = async (application: EditorBoardApplicationResponse) => {
    setSelectedApplication(application);

    try {
      const details = await getApplicationDetails(application.id);
      setSelectedApplication((current) => (current?.id === application.id ? details : current));
    } catch (error) {
      toast.error(getEditorBoardApiErrorMessage(error, 'Unable to load application details.'));
      setSelectedApplication((current) => current ?? application);
    }
  };

  return (
    <section className="px-5 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-black leading-8 text-white">Publication Reviews</h1>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Review submitted publish, arc, and chapter requests from your projects
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,260px)_minmax(220px,260px)]">
        <div className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-[4px] border border-[#39424f] bg-[#151c25] px-4 text-[#8b94a1]">
          <Search className="size-4 text-[#dce7f3]" />
          <input
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#8b94a1]"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by request title or project name..."
            value={searchQuery}
          />
        </div>
        <Select onValueChange={setStatusFilter} value={statusFilter}>
          <SelectTrigger className="h-10 w-full border-[#39424f] bg-[#151c25] text-xs font-bold text-white focus:ring-[#FFD369]/30">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent
            align="start"
            className="w-[var(--radix-select-trigger-width)] min-w-0 border-[#39424f] bg-[#151c25] text-white"
            position="popper"
            side="bottom"
            sideOffset={4}
          >
            {STATUS_FILTERS.map((status) => (
              <SelectItem key={status} value={status}>
                {status === 'ALL' ? 'All statuses' : getStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setTypeFilter} value={typeFilter}>
          <SelectTrigger className="h-10 w-full border-[#39424f] bg-[#151c25] text-xs font-bold text-white focus:ring-[#FFD369]/30">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent
            align="start"
            className="w-[var(--radix-select-trigger-width)] min-w-0 border-[#39424f] bg-[#151c25] text-white"
            position="popper"
            side="bottom"
            sideOffset={4}
          >
            {TYPE_FILTERS.map((type) => (
              <SelectItem key={type} value={type}>
                {type === 'ALL' ? 'All types' : getApplicationTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="mt-4 space-y-3">
        {isLoading ? (
          <article className="rounded-[5px] border border-[#39424f] bg-[#101820] px-5 py-5 text-xs font-bold text-[#aeb7c2]">
            Loading applications...
          </article>
        ) : filteredApplications.length ? (
          filteredApplications.map((application) => {
            const ApplicationTypeIcon = APPLICATION_TYPE_ICONS[application.type] ?? FileText;

            return (
              <article
                className="rounded-[5px] border border-[#39424f] bg-[#101820] px-5 py-4 transition-colors hover:border-[#FFD369]/60 hover:bg-[#17202b]"
                key={application.id}
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="flex min-w-0 gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-[4px] border border-[#39424f] bg-[#202832] text-[#FFD369]">
                      <ApplicationTypeIcon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-base font-black leading-6 text-white">
                          {application.title}
                        </h2>
                        <Badge
                          className="h-7 rounded-full border border-[#39424f] bg-[#1a222d] px-3 text-[11px] font-bold text-[#dce7f3]"
                          variant="outline"
                        >
                          {getApplicationTypeLabel(application.type)}
                        </Badge>
                        <Badge
                          className={`h-7 rounded-full border px-3 text-[11px] font-bold ${getStatusStyle(application.status)}`}
                          variant="outline"
                        >
                          {getStatusLabel(application.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs font-bold text-[#aeb7c2]">
                        {application.project?.name} - By{' '}
                        {application.createdByUser?.displayName || 'Unknown'} -{' '}
                        {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-[#dce7f3]">
                        {application.description ?? 'No description provided.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="h-9 shrink-0 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
                    onClick={() => void handleOpenApplication(application)}
                    variant="outline"
                  >
                    Review
                  </Button>
                </div>
              </article>
            );
          })
        ) : (
          <article className="rounded-[5px] border border-[#39424f] bg-[#101820] px-5 py-5 text-xs font-bold text-[#aeb7c2]">
            No applications found.
          </article>
        )}
        <div ref={loadMoreRef} />
        {isLoadingMore ? (
          <article className="rounded-[5px] border border-[#39424f] bg-[#101820] px-5 py-4 text-center text-xs font-bold text-[#aeb7c2]">
            Loading more applications...
          </article>
        ) : null}
      </section>

      <ApplicationReviewDrawer
        application={selectedApplication}
        canApprove={canApprove}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedApplication(null);
          }
        }}
        onUpdateStatus={(application, status) => void handleUpdateStatus(application, status)}
      />
    </section>
  );
}
// PhucTD #editor-board end
