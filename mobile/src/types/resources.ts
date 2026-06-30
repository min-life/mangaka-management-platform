export type ResourceNodeType = 'folder' | 'file';

export type ResourceTaskStatus = 'PENDING' | 'INPROGRESS' | 'REVIEW' | 'DONE';

export interface ResourceTaskFrame {
  id: string;
  name: string;
  description?: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResourceTaskComment {
  id: string;
  frameId: string;
  initials: string;
  author: string;
  authorRole: string;
  time: string;
  body: string;
  content: {
    text: string;
    mentions?: string[];
    attachments?: unknown[];
  };
  mention?: string;
}

export interface ResourceFileTask {
  id: string;
  fileId: string;
  title: string;
  description?: string;
  status: ResourceTaskStatus;
  deadline?: string;
  assignedBy?: string;
  assignedByName?: string;
  createdBy: string;
  createdByName: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
  frames: ResourceTaskFrame[];
  comments: ResourceTaskComment[];
}

export interface ResourceFileMaterialVersion {
  id: string;
  fileId: string;
  materials: {
    title: string;
    note?: string;
    imageUri: string;
    layers?: string[];
    pages?: Array<{ index: number; url: string }>;
    editorState?: Record<string, unknown>;
  };
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceNodeBase {
  id: string;
  name: string;
  type: ResourceNodeType;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
  coverUri?: string;
}

export interface ResourceFolderNode extends ResourceNodeBase {
  type: 'folder';
  projectId?: string;
  parentId: string | null;
  description?: string;
  children: ResourceNode[];
}

export interface ResourceFileNode extends ResourceNodeBase {
  type: 'file';
  folderId?: string;
  description?: string;
  language: string;
  content: string;
  previewImageUri?: string;
  tasks?: ResourceFileTask[];
  materialVersions?: ResourceFileMaterialVersion[];
}

export type ResourceNode = ResourceFolderNode | ResourceFileNode;

export interface ProjectResourceTree {
  projectId: string;
  root: ResourceFolderNode;
}
