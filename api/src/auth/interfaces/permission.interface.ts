// ChuongTV #005 start
export interface PermissionMetadata {
  mode: PermissionMode;
  permissions: string[];
  resource?: Resource;
}

export type PermissionMode = 'ANY' | 'ALL';
export type Resource =
  | 'FOLDER'
  | 'FILE'
  | 'TASK'
  | 'FRAME'
  | 'COMMENT'
  | 'ROLE'
  | 'PROJECT'
  | 'COMPANY';
// ChuongTV #005 end
