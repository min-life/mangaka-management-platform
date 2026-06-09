// ChuongTV #005 start
export interface PermissionMetadata {
  mode: PermissionMode;
  permissions: string[];
}

export type PermissionMode = 'ANY' | 'ALL';
// ChuongTV #005 end
