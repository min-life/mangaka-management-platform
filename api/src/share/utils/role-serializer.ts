import { SCOPE } from '@prisma/client';

export function serializeRole(role: {
  id: number;
  code: string;
  name: string;
  scope: SCOPE;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  rolePermissions?: { permission: { id: number; name: string; scope: string } }[];
}) {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    scope: role.scope,
    isDefault: role.isDefault,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    ...(role.rolePermissions
      ? {
          permissions: role.rolePermissions.map((rp) => ({
            id: String(rp.permission.id),
            name: rp.permission.name,
            scope: rp.permission.scope,
          })),
        }
      : {}),
  };
}
