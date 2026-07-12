-- 1. Thêm Permissions
INSERT INTO "permissions" ("name", "scope", "description") VALUES
  ('admin', 'SYS', 'Quyền Admin tối cao'),
  ('staff', 'SYS', 'Định danh nhân viên quản trị'),
  ('user:read', 'SYS', 'Xem danh sách người dùng'),
  ('user:create', 'SYS', 'Tạo người dùng'),
  ('user:update', 'SYS', 'Cập nhật người dùng'),
  ('user:delete', 'SYS', 'Xóa người dùng'),
  ('role:read', 'SYS', 'Xem danh sách vai trò'),
  ('role:create', 'SYS', 'Tạo vai trò'),
  ('role:update', 'SYS', 'Cập nhật vai trò'),
  ('role:delete', 'SYS', 'Xóa vai trò'),
  ('permission:read', 'SYS', 'Xem danh sách quyền'),
  ('permission:update', 'SYS', 'Cập nhật quyền'),
  ('project:read', 'PRJ', 'Xem thông tin dự án'),
  ('project:update', 'PRJ', 'Cập nhật thông tin dự án'),
  ('project:delete', 'PRJ', 'Xóa dự án'),
  ('project:member.read', 'PRJ', 'Xem danh sách thành viên dự án'),
  ('project:member.add', 'PRJ', 'Thêm thành viên vào dự án'),
  ('project:member.update', 'PRJ', 'Cập nhật vai trò thành viên dự án'),
  ('project:member.remove', 'PRJ', 'Xóa thành viên khỏi dự án'),
  ('project:folder.create', 'PRJ', 'Tạo thư mục trong dự án'),
  ('project:folder.update', 'PRJ', 'Cập nhật thư mục'),
  ('project:folder.delete', 'PRJ', 'Xóa thư mục'),
  ('project:file.create', 'PRJ', 'Tạo tệp tin'),
  ('project:file.update', 'PRJ', 'Cập nhật tệp tin'),
  ('project:file.delete', 'PRJ', 'Xóa tệp tin'),
  ('project:material.create', 'PRJ', 'Upload material'),
  ('project:material.update', 'PRJ', 'Cập nhật material'),
  ('project:material.delete', 'PRJ', 'Xóa material'),
  ('project:material.restore', 'PRJ', 'Khôi phục material'),
  ('project:task.create', 'PRJ', 'Tạo công việc'),
  ('project:task.update', 'PRJ', 'Cập nhật công việc'),
  ('project:task.delete', 'PRJ', 'Xóa công việc'),
  ('project:frame.create', 'PRJ', 'Tạo khung bình luận (frame)'),
  ('project:frame.update', 'PRJ', 'Cập nhật khung bình luận'),
  ('project:frame.delete', 'PRJ', 'Xóa khung bình luận'),
  ('project:comment.create', 'PRJ', 'Tạo bình luận'),
  ('project:comment.update', 'PRJ', 'Cập nhật bình luận'),
  ('project:comment.delete', 'PRJ', 'Xóa bình luận'),
  ('project:application.create', 'PRJ', 'Tạo đơn (application)'),
  ('project:application.read', 'PRJ', 'Xem danh sách đơn'),
  ('project:application.update', 'PRJ', 'Cập nhật đơn'),
  ('project:application.delete', 'PRJ', 'Xóa đơn'),
  ('project:application.approve', 'PRJ', 'Duyệt đơn')
ON CONFLICT ("name") DO NOTHING;

-- 2. Thêm 6 Roles
INSERT INTO "roles" ("code", "name", "scope", "is_default") VALUES
  ('ADMIN', 'Admin', 'SYS', false),
  ('STAFF', 'Staff', 'SYS', false),
  ('MEMBER', 'Member', 'SYS', true),
  ('MANGAKA', 'Mangaka', 'PRJ', false),
  ('ASSISTANT', 'Assistant', 'PRJ', false),
  ('TANTOU_EDITOR', 'Tantou Editor', 'PRJ', false)
ON CONFLICT ("code") DO NOTHING;

-- 3. Map Role Permissions
-- ADMIN
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r, "permissions" p
WHERE r.code = 'ADMIN' AND p.name IN ('admin')
ON CONFLICT DO NOTHING;

-- STAFF
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r, "permissions" p
WHERE r.code = 'STAFF' AND p.name IN (
  'staff', 'user:read', 'user:create', 'user:update', 'role:read', 'role:create', 'role:update', 'permission:read', 'permission:update'
)
ON CONFLICT DO NOTHING;

-- MEMBER
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r, "permissions" p
WHERE r.code = 'MEMBER' AND p.name IN (
  'user:read', 'role:read', 'permission:read'
)
ON CONFLICT DO NOTHING;

-- MANGAKA
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r, "permissions" p
WHERE r.code = 'MANGAKA' AND p.name IN (
  'project:read', 'project:update', 'project:delete', 'project:member.read', 'project:member.add', 'project:member.update', 'project:member.remove', 'project:folder.create', 'project:folder.update', 'project:folder.delete', 'project:file.create', 'project:file.update', 'project:file.delete', 'project:material.create', 'project:material.update', 'project:material.delete', 'project:material.restore', 'project:task.create', 'project:task.update', 'project:task.delete', 'project:frame.create', 'project:frame.update', 'project:frame.delete', 'project:comment.create', 'project:comment.update', 'project:comment.delete', 'project:application.create', 'project:application.read', 'project:application.update', 'project:application.delete'
)
ON CONFLICT DO NOTHING;

-- ASSISTANT
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r, "permissions" p
WHERE r.code = 'ASSISTANT' AND p.name IN (
  'project:read', 'project:member.read', 'project:material.create', 'project:material.update', 'project:task.update', 'project:frame.create', 'project:frame.update', 'project:comment.create', 'project:comment.update', 'project:application.read'
)
ON CONFLICT DO NOTHING;

-- TANTOU_EDITOR
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id FROM "roles" r, "permissions" p
WHERE r.code = 'TANTOU_EDITOR' AND p.name IN (
  'project:read', 'project:member.read', 'project:comment.create', 'project:comment.update', 'project:application.read', 'project:application.update', 'project:application.approve'
)
ON CONFLICT DO NOTHING;

-- 4. Sync Sequences
SELECT setval(pg_get_serial_sequence('permissions', 'id'), coalesce(max(id),0) + 1, false) FROM permissions;
SELECT setval(pg_get_serial_sequence('roles', 'id'), coalesce(max(id),0) + 1, false) FROM roles;
