'use client';

import { toast } from '@/lib/toast';
import { createProjectApplication, type ApplicationType } from '@/services/application.service';

import type { FileExplorerItem, FileVersionItem } from '../../file-ui';

type VersionActionsProps = {
  projectId: number;
  file: FileExplorerItem | null;
  selectedVersion: FileVersionItem | null;
  deletingVersionId: string | null;
  isLoading: boolean;
  loadFile: () => Promise<void>;
  setError: (err: string | null) => void;
  setIsLoading: (val: boolean) => void;
  setIsSubmittingReview: (val: boolean) => void;
  setSelectedVersion: (val: FileVersionItem | null) => void;

  setDeletingVersionId: (val: string | null) => void;
  setSelectedVersionForDetails: (val: FileVersionItem | null) => void;

};

export function useFileDetailVersionActions({
  projectId,
  file,
  selectedVersion,
  deletingVersionId,
  isLoading,
  loadFile,
  setError,
  setIsLoading,
  setIsSubmittingReview,
  setSelectedVersion,

  setDeletingVersionId,
  setSelectedVersionForDetails,

}: VersionActionsProps) {
  const handleCreateReview = async (input: {
    description?: string;
    title: string;
    type: ApplicationType;
  }) => {
    if (!file) {
      return;
    }

    setIsSubmittingReview(true);
    setError(null);

    try {
      await createProjectApplication(projectId, {
        ...input,
        materials: {
          files: [
            {
              folderId: file.folderId,
              title: file.title.replace(/ \*$/, ''),
              fileId: file.id,
            },
          ],
        },
      });
      toast.success('Review request submitted to Applications.');
    } catch {
      setError('Unable to create review request.');
    } finally {
      setIsSubmittingReview(false);
    }
  };



  return {
    handleCreateReview,

  };
}
