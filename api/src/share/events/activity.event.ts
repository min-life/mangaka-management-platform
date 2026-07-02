import { ACTIVITY_ACTION, ENTITY_TYPE, Prisma } from '@prisma/client';

export const ACTIVITY_EVENT_NAME = 'system.activity.created';

export class ActivityEventPayload {
  action!: ACTIVITY_ACTION;
  entityType!: ENTITY_TYPE;
  entityId!: number;
  actorId!: number;
  projectId?: number | null;
  editorBoardId?: number | null;
  fileId?: number | null;
  metadata?: Prisma.InputJsonValue;
}
