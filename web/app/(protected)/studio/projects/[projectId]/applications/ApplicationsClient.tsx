'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileCheck2, FileUp, Rocket, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  createProjectApplication,
  getProjectApplications,
  updateApplicationStatus,
  type ApplicationResponse,
  type ApplicationStatus,
  type ApplicationType,
} from '@/services/application.service';
import { getMyProjectPermissions } from '@/services/permission.service';

import { ApplicationReviewDrawer } from './ApplicationReviewDrawer';
import { CreateApplicationDialog, type UploadedApplicationFile } from './CreateApplicationDialog';
import {
  applicationStatusClassName,
  applicationTypeLabels,
  formatDate,
  formatStatus,
  readMaterialSummary,
} from './application-ui';

type ApplicationsClientProps = {
  projectId: number;
};

export function ApplicationsClient({ projectId }: ApplicationsClientProps) {
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponse | null>(null);
  const [mockRejectionReasons, setMockRejectionReasons] = useState<Record<number, string>>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ApplicationType>('MANUSCRIPT_REVIEW');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedApplicationFile[]>([]);

  const canCreate =
    permissions.includes('admin') ||
    permissions.includes('project:owner') ||
    permissions.includes('project:application.create') ||
    permissions.includes('project:update');
  const canApprove =
    permissions.includes('admin') ||
    permissions.includes('project:owner') ||
    permissions.includes('project:application.approve');

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [applicationResult, permissionResult] = await Promise.all([
        getProjectApplications(projectId),
        getMyProjectPermissions(projectId),
      ]);

      setApplications(applicationResult.applications);
      setPermissions(permissionResult);
    } catch {
      setError('Unable to load approvals.');
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

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
        [application.title, application.description ?? '', application.type, application.status].some(
          (value) => value.toLowerCase().includes(normalizedQuery),
        );

      return matchesStatus && matchesSearch;
    });
  }, [applications, searchQuery, statusFilter]);

  const pendingCount = applications.filter((application) => application.status === 'PENDING').length;
  const approvedCount = applications.filter((application) => application.status === 'APPROVE').length;
  const rejectedCount = applications.filter((application) => application.status === 'REJECT').length;

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setType('MANUSCRIPT_REVIEW');
    setUploadedFiles([]);
  };

  const handleCreateApplication = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await createProjectApplication(projectId, {
        description: description.trim() || undefined,
        materials: {
          uploadedFiles: uploadedFiles.map((file) => ({
            lastModified: file.lastModified,
            mimeType: file.mimeType,
            name: file.name,
            sizeBytes: file.sizeBytes,
          })),
          uploadSource: 'LOCAL_MACHINE_METADATA_ONLY',
        },
        title: title.trim(),
        type,
      });
      setOpenCreateDialog(false);
      resetCreateForm();
      await loadApplications();
    } catch {
      setError('Unable to create approval request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    application: ApplicationResponse,
    status: ApplicationStatus,
    options?: { rejectionReason?: string },
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateApplicationStatus(application.id, status);
      if (status === 'REJECT' && options?.rejectionReason) {
        setMockRejectionReasons((currentReasons) => ({
          ...currentReasons,
          [application.id]: options.rejectionReason ?? '',
        }));
      }
      setSelectedApplication((currentApplication) =>
        currentApplication?.id === application.id
          ? { ...currentApplication, status, updatedAt: new Date().toISOString() }
          : currentApplication,
      );
      await loadApplications();
    } catch {
      setError('Unable to update approval status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="px-5 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-black leading-8 text-white">Applications</h1>
          <p className="mt-1 text-sm font-medium text-[#aeb7c2]">
            Review manuscript submissions and publishing requests for this project.
          </p>
        </div>

        {canCreate ? (
          <CreateApplicationDialog
            description={description}
            isSubmitting={isSubmitting}
            onCreate={() => void handleCreateApplication()}
            onDescriptionChange={setDescription}
            onFilesChange={setUploadedFiles}
            onOpenChange={setOpenCreateDialog}
            onTitleChange={setTitle}
            onTypeChange={setType}
            open={openCreateDialog}
            title={title}
            type={type}
            uploadedFiles={uploadedFiles}
          />
        ) : null}
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
            placeholder="Search by request title, type, or status..."
            value={searchQuery}
          />
        </div>
      </div>

      <div className="mt-4 flex h-10 items-center gap-2 border-b border-[#26303b]">
        {(['ALL', 'PENDING', 'APPROVE', 'REJECT'] as const).map((status) => (
          <button
            className={`relative h-full px-2 text-xs font-black ${
              statusFilter === status ? 'text-[#FFD369]' : 'text-[#aeb7c2] hover:text-white'
            }`}
            key={status}
            onClick={() => setStatusFilter(status)}
            type="button"
          >
            {status === 'ALL' ? 'All' : formatStatus(status)}
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
                    {application.type === 'PUBLISH_REQUEST' ? (
                      <Rocket className="size-5" />
                    ) : (
                      <FileCheck2 className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-base font-black leading-6 text-white">
                        {application.title}
                      </h2>
                      <Badge
                        className={`h-7 rounded-full border px-3 text-[11px] font-bold ${applicationStatusClassName[application.status]}`}
                        variant="outline"
                      >
                        {formatStatus(application.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs font-bold text-[#aeb7c2]">
                      {applicationTypeLabels[application.type]} -{' '}
                      <FileUp className="mb-0.5 inline size-3" />{' '}
                      {readMaterialSummary(application.materials)} - Updated{' '}
                      {formatDate(application.updatedAt)}
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
                  {application.status === 'PENDING' ? 'Open Review' : 'View Result'}
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
        canApprove={canApprove}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedApplication(null);
          }
        }}
        rejectionReason={
          selectedApplication ? mockRejectionReasons[selectedApplication.id] : undefined
        }
        onUpdateStatus={(application, status, options) =>
          void handleUpdateStatus(application, status, options)
        }
      />
    </section>
  );
}
