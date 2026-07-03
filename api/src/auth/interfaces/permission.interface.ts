// ChuongTV #005 start
export interface PermissionMetadata {
  mode: PermissionMode;
  permissions: Permission[];
  resource?: Resource;
}

export type PermissionMode = 'ANY' | 'ALL';
export type Resource =
  | 'BOARD'
  | 'PROJECT'
  | 'FOLDER'
  | 'FILE'
  | 'MATERIAL'
  | 'TASK'
  | 'FRAME'
  | 'COMMENT'
  | 'APPLICATION'
  | 'PROJECT_STAT';
export type Permission =
  | 'admin'
  | 'staff'
  | 'user:read'
  | 'user:update'
  | 'user:delete'
  | 'user:create'
  | 'role:read'
  | 'role:update'
  | 'role:delete'
  | 'role:create'
  | 'permission:read'
  | 'permission:update'
  | 'board:owner'
  | 'board:leader'
  | 'board:member'
  | 'project:owner'
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'project:member.read'
  | 'project:member.update'
  | 'project:member.add'
  | 'project:member.remove'
  | 'project:folder.create'
  | 'project:folder.update'
  | 'project:folder.delete'
  | 'project:file.create'
  | 'project:file.update'
  | 'project:file.delete'
  | 'project:material.create'
  | 'project:material.update'
  | 'project:material.delete'
  | 'project:material.restore'
  | 'project:task.create'
  | 'project:task.update'
  | 'project:task.delete'
  | 'project:frame.create'
  | 'project:frame.update'
  | 'project:frame.delete'
  | 'project:comment.create'
  | 'project:comment.update'
  | 'project:comment.delete'
  | 'project:application.create'
  | 'project:application.read'
  | 'project:application.update'
  | 'project:application.delete'
  | 'project:application.approve';
// ChuongTV #005 end
