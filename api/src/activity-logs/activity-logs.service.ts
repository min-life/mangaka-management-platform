import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma, ACTIVITY_ACTION } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ACTIVITY_EVENT_NAME, ActivityEventPayload } from '../share/events/activity.event';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const ACTIVITY_INCLUDE = {
  actor: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      email: true,
    }
  }
};

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

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
      const logWithRelations = await this.prisma.activityLog.findUnique({
        where: { id: log.id },
        include: ACTIVITY_INCLUDE,
      });

      if (logWithRelations) {
        this.realtimeGateway.broadcastActivity(payload.projectId ?? null, payload.editorBoardId ?? null, logWithRelations);
      }

      // Determine who to notify
      const usersToNotify = new Set<number>();

      // 1. Task Created / Assigned
      if ((payload.action === ACTIVITY_ACTION.TASK_CREATED || payload.action === ACTIVITY_ACTION.TASK_ASSIGNED) && payload.metadata && typeof payload.metadata === 'object' && 'assignedBy' in payload.metadata) {
        if (payload.metadata.assignedBy !== payload.actorId) {
          usersToNotify.add(payload.metadata.assignedBy as number);
        }
      }

      // 2. Task Updated (Status change, etc)
      if (payload.action === ACTIVITY_ACTION.TASK_UPDATED && payload.metadata && typeof payload.metadata === 'object' && 'assigneeId' in payload.metadata) {
        if (payload.metadata.assigneeId !== payload.actorId) {
          usersToNotify.add(payload.metadata.assigneeId as number);
        }
      }

      // 3. Application Status changes
      if (
        (payload.action === ACTIVITY_ACTION.APPLICATION_INTERNAL_APPROVED ||
         payload.action === ACTIVITY_ACTION.APPLICATION_SUBMITTED ||
         payload.action === ACTIVITY_ACTION.APPLICATION_APPROVED ||
         payload.action === ACTIVITY_ACTION.APPLICATION_REJECTED) && 
        payload.metadata && typeof payload.metadata === 'object' && 'creatorId' in payload.metadata
      ) {
        if (payload.metadata.creatorId !== payload.actorId) {
          usersToNotify.add(payload.metadata.creatorId as number);
        }
      }

      // 4. Comment Created
      if (payload.action === ACTIVITY_ACTION.COMMENT_CREATED && payload.metadata && typeof payload.metadata === 'object' && 'mentionedUserIds' in payload.metadata) {
        const mentionedIds = payload.metadata.mentionedUserIds as number[];
        if (Array.isArray(mentionedIds)) {
          mentionedIds.forEach(id => {
            if (id !== payload.actorId) usersToNotify.add(id);
          });
        }
      }

      // 5. Member Invited
      if (payload.action === ACTIVITY_ACTION.MEMBER_INVITED && payload.metadata && typeof payload.metadata === 'object' && 'invitedUserIds' in payload.metadata) {
        const invitedIds = payload.metadata.invitedUserIds as number[];
        if (Array.isArray(invitedIds)) {
          invitedIds.forEach(id => {
            if (id !== payload.actorId) usersToNotify.add(id);
          });
        }
      }

      // Create notifications and emit
      for (const userId of usersToNotify) {
        const notif = await this.prisma.notification.create({
          data: {
            userId,
            activityLogId: log.id,
          },
          include: {
            activityLog: {
              include: ACTIVITY_INCLUDE,
            }
          }
        });
        this.realtimeGateway.notifyUser(userId, notif);
      }
    } catch (error) {
      this.logger.error('Failed to create activity log', error);
    }
  }

  async getActivityLogs(query: {
    page?: number;
    limit?: number;
    projectId?: number;
    editorBoardId?: number;
    actorId?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {};
    
    if (query.projectId) {
      where.projectId = query.projectId;
    }
    if (query.editorBoardId) {
      where.editorBoardId = query.editorBoardId;
    }
    if (query.actorId) {
      where.actorId = query.actorId;
    }

    try {
      const [total, data] = await Promise.all([
        this.prisma.activityLog.count({ where }),
        this.prisma.activityLog.findMany({
          where,
          include: ACTIVITY_INCLUDE,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get activity logs', error);
      throw new Error('Failed to get activity logs');
    }
  }
}
