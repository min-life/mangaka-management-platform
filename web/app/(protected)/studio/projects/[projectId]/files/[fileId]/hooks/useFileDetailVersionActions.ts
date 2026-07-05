'use client';

import { toast } from '@/lib/toast';
import { createProjectApplication, type ApplicationType } from '@/services/application.service';
import { restoreMaterial, deleteMaterial } from '@/services/material.service';
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
  setSelectedSubmissionId: (val: string | null) => void;
  setDeletingVersionId: (val: string | null) => void;
  setSelectedVersionForDetails: (val: FileVersionItem | null) => void;
  setVersionTabMode: (val: 'list' | 'detail') => void;
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
  setSelectedSubmissionId,
  setDeletingVersionId,
  setSelectedVersionForDetails,
  setVersionTabMode,
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

  const handleRestoreVersion = async (version: FileVersionItem) => {
    if (version.isCurrent) return;
    setIsLoading(true);
    setError(null);
    try {
      await restoreMaterial(version.id);
      toast.success(`Restored v${version.version}.`, {
        description: 'Newer material versions were rolled back by the API.',
      });
      setSelectedVersion(null);
      setSelectedSubmissionId(null);
      await loadFile();
    } catch (err) {
      console.error('Failed to restore material version:', err);
      toast.error('Failed to restore this version.');
      setError('Failed to restore this material version.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVersion = async (version: FileVersionItem) => {
    if (version.isCurrent) return;
    setDeletingVersionId(String(version.id));
    setError(null);
    try {
      await deleteMaterial(version.id);
      toast.success(`Deleted v${version.version}.`);
      if (selectedVersion && String(selectedVersion.id) === String(version.id)) {
        setSelectedVersion(null);
      }
      await loadFile();
      setVersionTabMode('list');
      setSelectedVersionForDetails(null);
    } catch (err) {
      console.error('Failed to delete material version:', err);
      toast.error('Failed to delete this version.');
      setError('Failed to delete this material version.');
    } finally {
      setDeletingVersionId(null);
    }
  };

  return {
    handleCreateReview,
    handleRestoreVersion,
    handleDeleteVersion,
  };
}
