'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AxiosError } from 'axios';
import { toast } from '@/lib/toast';
import { FileCheck2, FileUp, Rocket, Search } from 'lucide-react';
import { useRealtimeProjectActivity } from '@/hooks/use-realtime-activity';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  addApplicationMaterial,
  createApplicationComment,
  createProjectApplication,
  deleteApplication,
  deleteApplicationMaterial,
  getApplicationById,
  getApplicationComments,
  getProjectApplications,
  updateApplication,
  updateApplicationStatus,
  type ApplicationCommentResponse,
  type ApplicationResponse,
  type ApplicationStatus,
  type ApplicationType,
} from '@/services/application.service';
import { getMyProjectPermissions } from '@/services/permission.service';
import { getProjectFolders, type ProjectFolderResponse } from '@/services/project.service';

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

type ApplicationStatusFilter = 'ALL' | ApplicationStatus;

const applicationStatusTabs: Array<{ label: string; value: ApplicationStatusFilter }> = [
  { label: 'All Requests', value: 'ALL' },
  { label: 'Pending Draft', value: 'PENDING' },
  { label: 'Submitted to Board', value: 'SUBMITTED' },
  { label: 'Internal Approved', value: 'INTERNAL_APPROVED' },
  { label: 'Approved', value: 'APPROVE' },
  { label: 'Rejected', value: 'REJECT' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function ApplicationListSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <article
          className="rounded-[5px] border border-[#39424f] bg-[#101820] px-5 py-4"
          key={index}
        >
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 flex-1 gap-4">
              <div className="size-11 shrink-0 animate-pulse rounded-[4px] bg-[#1f2937]" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-52 animate-pulse rounded-[4px] bg-[#1f2937]" />
                  <div className="h-6 w-24 animate-pulse rounded-full bg-[#1f2937]" />
                </div>
                <div className="h-3 w-72 max-w-full animate-pulse rounded-[4px] bg-[#1f2937]" />
                <div className="h-4 w-full max-w-[560px] animate-pulse rounded-[4px] bg-[#1f2937]" />
              </div>
            </div>
            <div className="h-9 w-28 shrink-0 animate-pulse rounded-[4px] bg-[#1f2937]" />
          </div>
        </article>
      ))}
    </>
  );
}

export function ApplicationsClient({ projectId }: ApplicationsClientProps) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponse | null>(null);
  const [selectedComments, setSelectedComments] = useState<ApplicationCommentResponse[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ApplicationType>('CREATE_ARC');
  const [parentFolderId, setParentFolderId] = useState('');
  const [parentFolders, setParentFolders] = useState<ProjectFolderResponse[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedApplicationFile[]>([]);

  const { activities } = useRealtimeProjectActivity(projectId);

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
      const [applicationResult, permissionResult, folderResult] = await Promise.all([
        getProjectApplications(projectId),
        getMyProjectPermissions(projectId),
        getProjectFolders(projectId, { type: 'ARC' }),
      ]);

      setApplications(applicationResult.applications);
      setPermissions(permissionResult);
      setParentFolders(folderResult.folders);
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

  useEffect(() => {
    if (activities.length > 0) {
      const latestActivity = activities[0];
      if (latestActivity?.action?.startsWith('APPLICATION_')) {
        void loadApplications();
      }
    }
  }, [activities.length, loadApplications]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === 'ALL' || application.status === statusFilter;
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
    setType('CREATE_ARC');
    setParentFolderId('');
    setUploadedFiles([]);
  };

  const handleCreateApplication = async () => {
    const trimmedTitle = title.trim();
    const isFolderRequest = type === 'CREATE_ARC' || type === 'CREATE_CHAPTER';
    const imageFile =
      uploadedFiles.find((file) => file.role === 'image')?.file ??
      uploadedFiles.find((file) => !file.role && file.mimeType.startsWith('image/'))?.file;
    const textFile =
      uploadedFiles.find((file) => file.role === 'text')?.file ??
      uploadedFiles.find((file) => !file.role && !file.mimeType.startsWith('image/'))?.file;
    const sourceFile = uploadedFiles.find((file) => file.role === 'source')?.file;
    const materialFiles = uploadedFiles.filter((file) => file.role === 'material' || !file.role);

    if (!trimmedTitle) {
      toast.error('Title is required.');
      return;
    }

    if (type === 'CREATE_CHAPTER' && !parentFolderId) {
      toast.error('Please select the parent story arc for this chapter request.');
      return;
    }

    if (isFolderRequest && (!imageFile || !textFile)) {
      toast.error('Create arc/chapter requests require at least one image and one text/manuscript file.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createProjectApplication(projectId, {
        description: description.trim() || undefined,
        image: isFolderRequest ? imageFile : undefined,
        materials: isFolderRequest
          ? []
          : materialFiles.map((file) => ({
              kind: 'SUPPORTING_FILE',
              lastModified: file.lastModified,
              mimeType: file.mimeType,
              originalName: file.name,
              size: file.sizeBytes,
              uploadSource: 'LOCAL_MACHINE_METADATA_ONLY',
            })),
        parentFolderId: type === 'CREATE_CHAPTER' ? Number(parentFolderId) : undefined,
        source: isFolderRequest ? sourceFile : undefined,
        text: isFolderRequest ? textFile : undefined,
        title: trimmedTitle,
        type,
      });
      setOpenCreateDialog(false);
      resetCreateForm();
      await loadApplications();
      toast.success('Request submitted.');
    } catch (createError) {
      console.error('Unable to create approval request:', createError);
      if (createError instanceof AxiosError && createError.response?.data) {
        console.error('Create application response:', createError.response.data);
      }
      const apiMessage =
        createError instanceof AxiosError
          ? createError.response?.data?.message
          : undefined;
      const errorMsg =
        Array.isArray(apiMessage)
          ? apiMessage.join(' ')
          : typeof apiMessage === 'string'
            ? apiMessage
            : 'Unable to create approval request. Please check required fields and files.';
      toast.error(errorMsg);
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

    try {
      const nextStatus =
        status === 'APPROVE' &&
        application.status === 'PENDING' &&
        (application.type === 'CREATE_ARC' || application.type === 'CREATE_CHAPTER')
          ? 'INTERNAL_APPROVED'
          : status;

      await updateApplicationStatus(application.id, nextStatus);
      if (status === 'REJECT' && options?.rejectionReason) {
        await createApplicationComment(application.id, {
          kind: 'REJECTION_REASON',
          text: options.rejectionReason,
        });
      }
      setSelectedApplication((currentApplication) =>
        currentApplication?.id === application.id
          ? { ...currentApplication, status: nextStatus, updatedAt: new Date().toISOString() }
          : currentApplication,
      );
      await refreshSelectedApplication(application.id);
      if (status === 'APPROVE') {
        toast.success('Application approved.');
      } else if (status === 'REJECT') {
        toast.success('Application rejected.');
      } else if (status === 'CANCELLED') {
        toast.success('Application cancelled.');
      } else {
        toast.success('Status updated.');
      }
    } catch {
      toast.error('Failed to update status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleOpenApplication = async (application: ApplicationResponse) => {
    setSelectedApplication(application);
    setSelectedComments([]);

    try {
      const [detail, commentResult] = await Promise.all([
        getApplicationById(application.id),
        getApplicationComments(application.id),
      ]);
      if (detail) {
        setSelectedApplication(detail);
      }
      setSelectedComments(commentResult.comments);
    } catch (detailError) {
      console.error('Unable to load application detail:', detailError);
    }
  };

  const refreshSelectedApplication = async (applicationId: number) => {
    const [detail, commentResult] = await Promise.all([
      getApplicationById(applicationId),
      getApplicationComments(applicationId),
      loadApplications(),
    ]);

    if (detail) {
      setSelectedApplication(detail);
    }
    setSelectedComments(commentResult.comments);
  };

  const handleUpdateApplication = async (
    application: ApplicationResponse,
    payload: { description?: string; title?: string },
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateApplication(application.id, payload);
      await refreshSelectedApplication(application.id);
    } catch (updateError) {
      console.error('Unable to update application:', updateError);
      toast.error('Failed to update application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplication = async (application: ApplicationResponse) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await deleteApplication(application.id);
      setSelectedApplication(null);
      setSelectedComments([]);
      await loadApplications();
      toast.success('Application deleted.');
    } catch (deleteError) {
      console.error('Unable to delete application:', deleteError);
      toast.error('Failed to delete application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateComment = async (application: ApplicationResponse, text: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await createApplicationComment(application.id, { text });
      await refreshSelectedApplication(application.id);
    } catch (commentError) {
      console.error('Unable to create application comment:', commentError);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMaterial = async (application: ApplicationResponse, materialItem: unknown) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await addApplicationMaterial(application.id, materialItem);
      await refreshSelectedApplication(application.id);
    } catch (materialError) {
      console.error('Unable to add application material:', materialError);
      toast.error('Failed to add material. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (application: ApplicationResponse, index: number) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await deleteApplicationMaterial(application.id, index);
      await refreshSelectedApplication(application.id);
    } catch (materialError) {
      console.error('Unable to delete application material:', materialError);
      toast.error('Failed to delete material. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading applications..." minHeight="70vh" />;
  }

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
            onParentFolderIdChange={setParentFolderId}
            onTitleChange={setTitle}
            onTypeChange={setType}
            open={openCreateDialog}
            parentFolderId={parentFolderId}
            parentFolders={parentFolders}
            title={title}
            type={type}
            uploadedFiles={uploadedFiles}
          />
        ) : null}
      </div>



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

      <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-[4px] border border-[#39424f] bg-[#151c25] px-4 text-[#8b94a1]">
          <Search className="size-4 text-[#dce7f3]" />
          <input
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-[#8b94a1]"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by request title, type, or status..."
            value={searchQuery}
          />
        </div>
        
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as ApplicationStatusFilter)}
        >
          <SelectTrigger className="h-10 w-full sm:w-44 rounded-[4px] border-[#39424f] bg-[#151c25] text-xs text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="border-[#39424f] bg-[#151c25] text-white">
            {applicationStatusTabs.map((tab) => (
              <SelectItem
                key={tab.value}
                value={tab.value}
                className="text-xs hover:bg-[#1f2937] focus:bg-[#1f2937] text-white"
              >
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="mt-4 space-y-3">
        {filteredApplications.length ? (
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
                  onClick={() => void handleOpenApplication(application)}
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
        canCancel={
          selectedApplication
            ? selectedApplication.createdByUser?.id === user?.id ||
              permissions.includes('admin') ||
              permissions.includes('project:owner') ||
              permissions.includes('project:application.approve')
            : false
        }
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedApplication(null);
            setSelectedComments([]);
          }
        }}
        rejectionReason={
          (() => {
            const comment = selectedComments.find(
              (c) =>
                c.content &&
                typeof c.content === 'object' &&
                (c.content as any).kind === 'REJECTION_REASON'
            );
            return comment ? (comment.content as any).text : undefined;
          })()
        }
        onUpdateStatus={(application, status, options) =>
          void handleUpdateStatus(application, status, options)
        }
        onDeleteApplication={(application) =>
          void handleDeleteApplication(application)
        }
      />
    </section>
  );
}
