import { SCOPE } from '@prisma/client';

export function serializeRole(role: {
  id: bigint;
  name: string;
  code: string | null;
  scope: SCOPE;
  companyId: bigint | null;
  projectId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: role.id.toString(),
    name: role.name,
    code: role.code,
    scope: role.scope,
    companyId: role.companyId?.toString() ?? null,
    projectId: role.projectId?.toString() ?? null,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
