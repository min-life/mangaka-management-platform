import type { ApplicationStatus, ApplicationType } from '@/services/application.service';

export type UploadedMaterialFile = {
  lastModified?: number;
  mimeType?: string;
  name: string;
  sizeBytes?: number;
  url?: string;
};

export const applicationTypeLabels: Record<ApplicationType, string> = {
  CREATE_ARC: 'Create Story Arc',
  CREATE_CHAPTER: 'Create Chapter',
  MANUSCRIPT_REVIEW: 'Manuscript Review',
  PUBLISH_REQUEST: 'Publish Request',
};

export const applicationStatusClassName: Record<ApplicationStatus, string> = {
  APPROVE: 'border-[#315846] bg-[#14291f] text-[#9df2c7]',
  CANCELLED: 'border-[#4a4f55] bg-[#20282b] text-[#dce7f3]',
  PENDING: 'border-[#6c5516] bg-[#30270d] text-[#ffd35b]',
  REJECT: 'border-[#6b2637] bg-[#371522] text-[#ff9ab3]',
  SUBMITTED: 'border-[#725621] bg-[#2d220f] text-[#ffd369]',
};

export function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatStatus(status: ApplicationStatus) {
  if (status === 'APPROVE') {
    return 'Approved';
  }

  if (status === 'REJECT') {
    return 'Rejected';
  }

  if (status === 'CANCELLED') {
    return 'Cancelled';
  }

  if (status === 'SUBMITTED') {
    return 'Submitted';
  }

  return 'Pending';
}

export function readUploadedFiles(materials: unknown): UploadedMaterialFile[] {
  if (!materials || typeof materials !== 'object') {
    return [];
  }

  if (Array.isArray(materials)) {
    return materials.map((material) => {
      if (!material || typeof material !== 'object') {
        return { name: 'Attached material' };
      }

      const name =
        'originalName' in material && typeof material.originalName === 'string'
          ? material.originalName
          : 'name' in material && typeof material.name === 'string'
            ? material.name
            : 'Attached material';

      return {
        mimeType:
          'mimeType' in material && typeof material.mimeType === 'string'
            ? material.mimeType
            : undefined,
        name,
        sizeBytes:
          'size' in material && typeof material.size === 'number'
            ? material.size
            : 'sizeBytes' in material && typeof material.sizeBytes === 'number'
              ? material.sizeBytes
              : undefined,
        url:
          'url' in material && typeof material.url === 'string'
            ? material.url
            : undefined,
      };
    });
  }

  if ('uploadedFiles' in materials && Array.isArray(materials.uploadedFiles)) {
    const uploadedFiles: UploadedMaterialFile[] = [];

    materials.uploadedFiles.forEach((file) => {
      if (!file || typeof file !== 'object') {
        return;
      }

      if (!('name' in file) || typeof file.name !== 'string') {
        return;
      }

      uploadedFiles.push({
        lastModified:
          'lastModified' in file && typeof file.lastModified === 'number'
            ? file.lastModified
            : undefined,
        mimeType:
          'mimeType' in file && typeof file.mimeType === 'string' ? file.mimeType : undefined,
        name: file.name,
        sizeBytes:
          'sizeBytes' in file && typeof file.sizeBytes === 'number' ? file.sizeBytes : undefined,
        url:
          'url' in file && typeof file.url === 'string' ? file.url : undefined,
      });
    });

    return uploadedFiles;
  }

  if ('files' in materials && Array.isArray(materials.files)) {
    return materials.files.map((file) => {
      if (typeof file === 'number' || typeof file === 'string') {
        return { name: String(file) };
      }

      if (file && typeof file === 'object' && 'name' in file && typeof file.name === 'string') {
        return { name: file.name };
      }

      if (file && typeof file === 'object' && 'title' in file && typeof file.title === 'string') {
        return { name: file.title };
      }

      return { name: 'Attached file' };
    });
  }

  if ('assets' in materials && Array.isArray(materials.assets)) {
    return materials.assets.map((asset) => {
      if (asset && typeof asset === 'object' && 'name' in asset && typeof asset.name === 'string') {
        return { name: asset.name };
      }

      return { name: 'Attached asset' };
    });
  }

  return [];
}

export function readMaterialSummary(materials: unknown) {
  const itemCount = readUploadedFiles(materials).length;

  return `${itemCount} file${itemCount === 1 ? '' : 's'} attached`;
}

export function formatFileSize(sizeBytes?: number) {
  if (!sizeBytes) {
    return 'Unknown size';
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
}
