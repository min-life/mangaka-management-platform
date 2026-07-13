export type ApplicationType = 'CREATE_ARC' | 'CREATE_CHAPTER';
export type ApplicationStatus = 'PENDING' | 'APPROVE' | 'REJECT' | 'CANCELLED';

export interface ApplicationMaterialPage {
  height?: number;
  id: string;
  isThumbnail?: boolean;
  mimeType?: string;
  originalName: string;
  size?: number;
  title: string;
  type?: string;
  url?: string;
  width?: number;
}

export interface ApplicationItem {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  description: string;
  type: ApplicationType;
  status: ApplicationStatus;
  createdBy: string;
  verifyBy?: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  materials: {
    pages: ApplicationMaterialPage[];
    note: string;
  };
}
