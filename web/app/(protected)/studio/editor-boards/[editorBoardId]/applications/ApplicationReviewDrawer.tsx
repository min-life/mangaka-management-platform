'use client';

import { Check, FileUp, X, Ban } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { getStatusLabel, getStatusStyle } from './application-ui';

type ApplicationResponse = {
  createdAt: string;
  createdByUser?: { avatarUrl?: string; displayName?: string; email?: string };
  description?: string;
  id: number;
  materials?: any;
  project?: { id: number; name: string };
  status: string;
  title: string;
  type: string;
  updatedAt: string;
  verifiedByUser?: { displayName?: string; email?: string };
  verifyBy?: number;
  createdBy?: number;
};

type ApplicationReviewDrawerProps = {
  application: ApplicationResponse | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (
    application: ApplicationResponse,
    status: string,
  ) => void;
};

function formatFileSize(bytes?: number) {
  if (!bytes) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function readUploadedFiles(materials: any) {
  if (!materials || !materials.uploadedFiles || !Array.isArray(materials.uploadedFiles)) {
    return [];
  }
  return materials.uploadedFiles as Array<{
    name: string;
    mimeType: string;
    sizeBytes: number;
    lastModified: number;
  }>;
}

// PhucTD #editor-board start
export function ApplicationReviewDrawer({
  application,
  isSubmitting,
  onOpenChange,
  onUpdateStatus,
}: ApplicationReviewDrawerProps) {
  const uploadedFiles = application ? readUploadedFiles(application.materials) : [];
  
  const submittedBy =
    application?.createdByUser?.displayName ??
    application?.createdByUser?.email ??
    (application?.createdBy ? `User #${application.createdBy}` : 'Unknown user');

  const reviewedBy =
    application?.verifiedByUser?.displayName ??
    application?.verifiedByUser?.email ??
    (application?.verifyBy ? `User #${application.verifyBy}` : null);

  // We consider that the user viewing this page is an owner or lead who can approve.
  // The actual check is enforced by the backend endpoint.
  const canApprove = true;

  return (
    <Sheet onOpenChange={onOpenChange} open={Boolean(application)}>
      <SheetContent
        className="w-[540px] max-w-[92vw] gap-0 border-[#39424f] bg-[#101820] p-0 text-white sm:max-w-[540px]"
        showCloseButton={false}
        side="right"
      >
        {application ? (
          <>
            <SheetHeader className="relative border-b border-[#303842] px-5 py-5 pr-14">
              <button
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-[4px] text-[#aeb7c2] hover:bg-[#303842] hover:text-white"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <SheetTitle className="text-xl font-black text-white">
                    {application.title}
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-xs font-bold text-[#aeb7c2]">
                    Submitted {new Date(application.createdAt).toLocaleDateString()}
                  </SheetDescription>
                </div>
                <Badge
                  className={`mt-0.5 h-7 shrink-0 rounded-full border px-3 text-[11px] font-bold ${getStatusStyle(application.status)}`}
                  variant="outline"
                >
                  {getStatusLabel(application.status)}
                </Badge>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 h-full pb-20">
              <div className="grid grid-cols-2 gap-3">
                <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Project
                  </p>
                  <p className="mt-3 truncate text-sm font-black text-white">
                    {application.project?.name || 'Unknown'}
                  </p>
                </article>
                <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Submitted By
                  </p>
                  <p className="mt-3 truncate text-sm font-black text-white">{submittedBy}</p>
                </article>
                <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Submitted At
                  </p>
                  <p className="mt-3 text-sm font-black text-white">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </article>
                <article className="rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Reviewed By
                  </p>
                  <p className="mt-3 truncate text-sm font-black text-white">
                    {reviewedBy ?? (application.status === 'PENDING' ? 'Not reviewed yet' : 'Unknown reviewer')}
                  </p>
                </article>
              </div>

              <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                  Description
                </p>
                <p className="mt-3 text-sm font-medium leading-6 text-[#dce7f3]">
                  {application.description ?? 'No description provided.'}
                </p>
              </section>

              <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                  Uploaded Files
                </p>
                <div className="mt-3 space-y-2">
                  {uploadedFiles.length ? (
                    uploadedFiles.map((file) => (
                      <div
                        className="flex min-h-12 items-center gap-3 rounded-[3px] border border-[#303842] bg-[#101820] px-3 py-2"
                        key={`${file.name}-${file.sizeBytes ?? 'unknown'}`}
                      >
                        <FileUp className="size-4 shrink-0 text-[#FFD369]" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-white">{file.name}</p>
                          <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                            {file.mimeType ?? 'Unknown type'} - {formatFileSize(file.sizeBytes)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-bold text-[#aeb7c2]">No uploaded files.</p>
                  )}
                </div>
              </section>

              <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                  Activity
                </p>
                <div className="mt-4 space-y-4">
                  <div className="flex gap-3">
                    <span className="mt-1 size-2 rounded-full bg-[#FFD369]" />
                    <div>
                      <p className="text-xs font-black text-white">Submitted</p>
                      <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                        {submittedBy} submitted this request on {new Date(application.createdAt).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                  {application.status === 'PENDING' ? (
                    <div className="flex gap-3">
                      <span className="mt-1 size-2 rounded-full bg-[#4b535f]" />
                      <div>
                        <p className="text-xs font-black text-white">Waiting for review</p>
                        <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                          No review event has been recorded yet.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <span
                        className={`mt-1 size-2 rounded-full ${
                          application.status === 'APPROVE' ? 'bg-[#9df2c7]' : 'bg-[#ff9ab3]'
                        }`}
                      />
                      <div>
                        <p className="text-xs font-black text-white">
                          {getStatusLabel(application.status)}
                        </p>
                        <p className="mt-1 text-[11px] font-bold text-[#8b94a1]">
                          {reviewedBy ?? 'Reviewer'} updated this request on{' '}
                          {new Date(application.updatedAt).toLocaleDateString()}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {canApprove && application.status === 'PENDING' ? (
                <section className="mt-4 rounded-[4px] border border-[#303842] bg-[#151c25] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8b94a1]">
                    Review Actions
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <Button
                      className="h-10 rounded-[4px] border-[#6b2637] bg-[#371522] px-4 text-xs font-black text-[#ff9ab3] hover:bg-[#4a1d2c]"
                      disabled={isSubmitting}
                      onClick={() => onUpdateStatus(application, 'REJECT')}
                      type="button"
                      variant="outline"
                    >
                      <X className="mr-1.5 size-4" />
                      Reject
                    </Button>
                    <Button
                      className="h-10 rounded-[4px] border-[#4a4f55] bg-[#20282b] px-4 text-xs font-black text-[#dce7f3] hover:bg-[#2b3539]"
                      disabled={isSubmitting}
                      onClick={() => onUpdateStatus(application, 'CANCELLED')}
                      type="button"
                      variant="outline"
                    >
                      <Ban className="mr-1.5 size-4" />
                      Cancel
                    </Button>
                    <Button
                      className="h-10 rounded-[4px] bg-[#FFD369] px-4 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
                      disabled={isSubmitting}
                      onClick={() => onUpdateStatus(application, 'APPROVE')}
                      type="button"
                    >
                      <Check className="mr-1.5 size-4" />
                      Approve
                    </Button>
                  </div>
                </section>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
// PhucTD #editor-board end
