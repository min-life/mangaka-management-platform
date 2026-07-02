'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Rocket, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type ApplicationResponse,
  type ApplicationStatus,
  updateApplicationStatus,
} from '@/services/application.service';
import { getEditorBoardApplications } from '@/services/editor-board.service';

import { ApplicationReviewDrawer } from './ApplicationReviewDrawer';
import { getStatusLabel, getStatusStyle } from './application-ui';

type ApplicationsClientProps = {
  editorBoardId: number;
};

// PhucTD #editor-board start
export function ApplicationsClient({ editorBoardId }: ApplicationsClientProps) {
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponse | null>(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getEditorBoardApplications(editorBoardId);
      setApplications(response.applications);
    } catch {
      setError('Unable to load applications.');
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [editorBoardId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadApplications();
    });
  }, [loadApplications]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      const matchesSearch =
        !normalizedQuery ||
        [application.title, application.project?.name, application.status]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesSearch;
    });
  }, [applications, searchQuery, statusFilter]);

  const pendingCount = applications.filter((app) => app.status === 'PENDING').length;
  const approvedCount = applications.filter((app) => app.status === 'APPROVE').length;
  const rejectedCount = applications.filter((app) => app.status === 'REJECT').length;

  const handleUpdateStatus = async (
    application: ApplicationResponse,
    status: ApplicationStatus,
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateApplicationStatus(application.id, status);
      setSelectedApplication((current) =>
        current?.id === application.id
          ? { ...current, status, updatedAt: new Date().toISOString() }
          : current,
      );
      await loadApplications();
    } catch {
      setError('Unable to update application status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="px-5 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-black leading-8 text-white">Publication Reviews</h1>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Review and approve publish requests from your projects
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-[4px] border border-red-400/30 bg-red-950/20 px-4 py-3 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-3 gap-4">
        <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
            Pending Review
          </p>
          <p className="mt-3 text-2xl font-black text-white">{pendingCount}</p>
          <p className="mt-1 text-[11px] font-bold text-[#FFD369]">Need attention</p>
        </article>
        <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
            Approved Requests
          </p>
          <p className="mt-3 text-2xl font-black text-white">{approvedCount}</p>
          <p className="mt-1 text-[11px] font-bold text-[#9df2c7]">Cleared for production</p>
        </article>
        <article className="rounded-[5px] border border-[#39424f] bg-[#1a222d] p-4">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2]">
            Rejected Requests
          </p>
          <p className="mt-3 text-2xl font-black text-white">{rejectedCount}</p>
          <p className="mt-1 text-[11px] font-bold text-[#ff9ab3]">Needs revision</p>
        </article>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-[4px] border border-[#39424f] bg-[#151c25] px-4 text-[#8b94a1]">
          <Search className="size-4 text-[#dce7f3]" />
          <input
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#8b94a1]"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by request title or project name..."
            value={searchQuery}
          />
        </div>
      </div>

      <div className="mt-4 flex h-10 items-center gap-2 border-b border-[#26303b]">
        {(['ALL', 'PENDING', 'APPROVE', 'REJECT', 'CANCELLED'] as const).map((status) => (
          <button
            className={`relative h-full px-2 text-xs font-black ${
              statusFilter === status ? 'text-[#FFD369]' : 'text-[#aeb7c2] hover:text-white'
            }`}
            key={status}
            onClick={() => setStatusFilter(status)}
            type="button"
          >
            {status === 'ALL' ? 'All' : getStatusLabel(status)}
            {statusFilter === status ? (
              <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-[#FFD369]" />
            ) : null}
          </button>
        ))}
      </div>

      <section className="mt-4 space-y-3">
        {isLoading ? (
          <article className="rounded-[5px] border border-[#39424f] bg-[#101820] px-5 py-5 text-xs font-bold text-[#aeb7c2]">
            Loading applications...
          </article>
        ) : filteredApplications.length ? (
          filteredApplications.map((application) => (
            <article
              className="rounded-[5px] border border-[#39424f] bg-[#101820] px-5 py-4 transition-colors hover:border-[#FFD369]/60 hover:bg-[#17202b]"
              key={application.id}
            >
              <div className="flex items-start justify-between gap-5">
                <div className="flex min-w-0 gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[4px] border border-[#39424f] bg-[#202832] text-[#FFD369]">
                    <Rocket className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-base font-black leading-6 text-white">
                        {application.title}
                      </h2>
                      <Badge
                        className={`h-7 rounded-full border px-3 text-[11px] font-bold ${getStatusStyle(application.status)}`}
                        variant="outline"
                      >
                        {getStatusLabel(application.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs font-bold text-[#aeb7c2]">
                      {application.project?.name} - By {application.createdByUser?.displayName || 'Unknown'} -{' '}
                      {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm font-medium text-[#dce7f3]">
                      {application.description ?? 'No description provided.'}
                    </p>
                  </div>
                </div>
                <Button
                  className="h-9 shrink-0 rounded-[4px] border-[#4b535f] bg-[#101820] px-4 text-xs font-black text-white hover:bg-[#303842]"
                  onClick={() => setSelectedApplication(application)}
                  variant="outline"
                >
                  Review
                </Button>
              </div>
            </article>
          ))
        ) : (
          <article className="rounded-[5px] border border-[#39424f] bg-[#101820] px-5 py-5 text-xs font-bold text-[#aeb7c2]">
            No applications found.
          </article>
        )}
      </section>

      <ApplicationReviewDrawer
        application={selectedApplication}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedApplication(null);
          }
        }}
        onUpdateStatus={(application, status) =>
          void handleUpdateStatus(application, status)
        }
      />
    </section>
  );
}
// PhucTD #editor-board end
