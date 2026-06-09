import { SCOPE } from '@prisma/client';

export function serializeRole(role: {
  id: bigint;
  name: string;
  scope: SCOPE;
  companyId: bigint | null;
  projectId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: role.id.toString(),
    name: role.name,
    scope: role.scope,
    companyId: role.companyId?.toString() ?? null,
    projectId: role.projectId?.toString() ?? null,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
