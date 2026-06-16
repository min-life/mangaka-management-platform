import { SCOPE } from '@prisma/client';

export function serializeRole(role: {
  id: number;
  code: string;
  name: string;
  scope: SCOPE;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    scope: role.scope,
    isDefault: role.isDefault,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
