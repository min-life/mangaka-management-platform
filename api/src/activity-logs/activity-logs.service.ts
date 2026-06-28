import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma, ACTIVITY_ACTION } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ACTIVITY_EVENT_NAME, ActivityEventPayload } from '../share/events/activity.event';

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(ACTIVITY_EVENT_NAME)
  async handleActivityEvent(payload: ActivityEventPayload) {
    try {
      const log = await this.prisma.activityLog.create({
        data: {
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          projectId: payload.projectId,
          editorBoardId: payload.editorBoardId,
          actorId: payload.actorId,
          metadata: payload.metadata ?? Prisma.DbNull,
        },
      });

      // Simple notification rule: If a task is created/assigned to someone else, notify them
      if (
        (payload.action === ACTIVITY_ACTION.TASK_CREATED || payload.action === ACTIVITY_ACTION.TASK_ASSIGNED) &&
        payload.metadata &&
        typeof payload.metadata === 'object' &&
        'assignedBy' in payload.metadata &&
        payload.metadata.assignedBy !== payload.actorId
      ) {
        await this.prisma.notification.create({
          data: {
            userId: payload.metadata.assignedBy as number,
            activityLogId: log.id,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to create activity log', error);
    }
  }
}
