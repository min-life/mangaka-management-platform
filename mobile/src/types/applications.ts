export type ApplicationType = 'MANUSCRIPT_REVIEW' | 'PUBLISH_REQUEST';
export type ApplicationStatus = 'PENDING' | 'APPROVE' | 'REJECT' | 'CANCELLED';

export interface ApplicationMaterialPage {
  id: string;
  title: string;
  fileName: string;
  status: 'Ready' | 'Needs review' | 'Blocked';
}

export interface ApplicationItem {
  id: string;
  projectId: string;
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

