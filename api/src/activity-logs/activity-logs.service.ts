import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma, ACTIVITY_ACTION, ENTITY_TYPE } from '@prisma/client';
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

type ActivityLogWithActor = Prisma.ActivityLogGetPayload<{
  include: typeof ACTIVITY_INCLUDE;
}>;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getNumberArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
    : [];
}

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
          fileId: payload.fileId,
          actorId: payload.actorId,
          metadata: payload.metadata ?? Prisma.DbNull,
        },
      });
      const logWithRelations = await this.prisma.activityLog.findUnique({
        where: { id: log.id },
        include: ACTIVITY_INCLUDE,
      });

      if (logWithRelations) {
        const [enrichedLog] = await this.enrichActivityLogs([logWithRelations]);
        this.realtimeGateway.broadcastActivity(payload.projectId ?? null, payload.editorBoardId ?? null, enrichedLog ?? logWithRelations);
      }

      // Determine who to notify
      const usersToNotify = new Set<number>();

      // 1. Task Created / Assigned
      if ((payload.action === ACTIVITY_ACTION.TASK_CREATED || payload.action === ACTIVITY_ACTION.TASK_ASSIGNED) && payload.metadata && typeof payload.metadata === 'object' && 'assignedTo' in payload.metadata) {
        if (payload.metadata.assignedTo !== payload.actorId && payload.metadata.assignedTo !== null) {
          usersToNotify.add(payload.metadata.assignedTo as number);
        }
      }

      // 2. Task Updated or Completed (Status change, etc)
      if ((payload.action === ACTIVITY_ACTION.TASK_UPDATED || payload.action === ACTIVITY_ACTION.TASK_COMPLETED) && payload.metadata && typeof payload.metadata === 'object') {
        if ('assigneeId' in payload.metadata && payload.metadata.assigneeId !== payload.actorId && payload.metadata.assigneeId !== null) {
          usersToNotify.add(payload.metadata.assigneeId as number);
        }
        if ('creatorId' in payload.metadata && payload.metadata.creatorId !== payload.actorId && payload.metadata.creatorId !== null) {
          usersToNotify.add(payload.metadata.creatorId as number);
        }
      }

      // 3. Application Created
      if (payload.action === ACTIVITY_ACTION.APPLICATION_CREATED && payload.metadata && typeof payload.metadata === 'object' && 'projectOwnerId' in payload.metadata) {
        if (payload.metadata.projectOwnerId !== payload.actorId && payload.metadata.projectOwnerId !== null) {
          usersToNotify.add(payload.metadata.projectOwnerId as number);
        }
      }

      // 4. Application Status changes
      if (
        (payload.action === ACTIVITY_ACTION.APPLICATION_INTERNAL_APPROVED ||
         payload.action === ACTIVITY_ACTION.APPLICATION_SUBMITTED ||
         payload.action === ACTIVITY_ACTION.APPLICATION_APPROVED ||
         payload.action === ACTIVITY_ACTION.APPLICATION_REJECTED) && 
        payload.metadata && typeof payload.metadata === 'object' && 'creatorId' in payload.metadata
      ) {
        if (payload.metadata.creatorId !== payload.actorId && payload.metadata.creatorId !== null) {
          usersToNotify.add(payload.metadata.creatorId as number);
        }
      }

      // 5. Comment Created
      if (payload.action === ACTIVITY_ACTION.COMMENT_CREATED) {
        // Find previous commenters on the same entity
        const commentObj = await this.prisma.comment.findUnique({
          where: { id: payload.entityId },
          select: { fileId: true, taskId: true, frameId: true, applicationId: true },
        });

        if (commentObj) {
          let whereCondition: Prisma.CommentWhereInput | null = null;
          if (commentObj.fileId) whereCondition = { fileId: commentObj.fileId };
          else if (commentObj.taskId) whereCondition = { taskId: commentObj.taskId };
          else if (commentObj.applicationId) whereCondition = { applicationId: commentObj.applicationId };
          else if (commentObj.frameId) whereCondition = { frameId: commentObj.frameId };

          if (whereCondition) {
            const relatedComments = await this.prisma.comment.findMany({
              where: whereCondition,
              select: { createdBy: true },
            });
            for (const c of relatedComments) {
              if (c.createdBy && c.createdBy !== payload.actorId) {
                usersToNotify.add(c.createdBy);
              }
            }
          }
        }

        if (payload.metadata && typeof payload.metadata === 'object') {
          if ('mentionedUserIds' in payload.metadata) {
            const mentionedIds = payload.metadata.mentionedUserIds as number[];
            if (Array.isArray(mentionedIds)) {
              mentionedIds.forEach(id => {
                if (id !== payload.actorId && id !== null) usersToNotify.add(id);
              });
            }
          }
          // Task Comment
          if ('assigneeId' in payload.metadata && payload.metadata.assigneeId !== payload.actorId && payload.metadata.assigneeId !== null) {
            usersToNotify.add(payload.metadata.assigneeId as number);
          }
          if ('creatorId' in payload.metadata && payload.metadata.creatorId !== payload.actorId && payload.metadata.creatorId !== null) {
            usersToNotify.add(payload.metadata.creatorId as number);
          }
          // Application Comment
          if ('applicantId' in payload.metadata && payload.metadata.applicantId !== payload.actorId && payload.metadata.applicantId !== null) {
            usersToNotify.add(payload.metadata.applicantId as number);
          }
          if ('projectOwnerId' in payload.metadata && payload.metadata.projectOwnerId !== payload.actorId && payload.metadata.projectOwnerId !== null) {
            usersToNotify.add(payload.metadata.projectOwnerId as number);
          }
          if ('projectMemberIds' in payload.metadata) {
            getNumberArray(payload.metadata.projectMemberIds).forEach((id) => {
              if (id !== payload.actorId) {
                usersToNotify.add(id);
              }
            });
          }
        }
      }

      // 6. Member Invited
      if (payload.action === ACTIVITY_ACTION.MEMBER_INVITED && payload.metadata && typeof payload.metadata === 'object' && 'invitedUserIds' in payload.metadata) {
        const invitedIds = payload.metadata.invitedUserIds as number[];
        if (Array.isArray(invitedIds)) {
          invitedIds.forEach(id => {
            if (id !== payload.actorId && id !== null) usersToNotify.add(id);
          });
        }
      }

      // 7. Member Removed
      if (payload.action === ACTIVITY_ACTION.MEMBER_REMOVED && payload.metadata && typeof payload.metadata === 'object' && 'removedUserId' in payload.metadata) {
        if (payload.metadata.removedUserId !== payload.actorId && payload.metadata.removedUserId !== null) {
          usersToNotify.add(payload.metadata.removedUserId as number);
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
    fileId?: number;
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
    if (query.fileId) {
      where.fileId = query.fileId;
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
      const enrichedData = await this.enrichActivityLogs(data);

      return {
        data: enrichedData,
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

  private async enrichActivityLogs(logs: ActivityLogWithActor[]) {
    const boardIds = new Set<number>();
    const userIds = new Set<number>();

    logs.forEach((log) => {
      const metadata = isRecord(log.metadata) ? log.metadata : {};
      const boardId = log.editorBoardId ?? (log.entityType === ENTITY_TYPE.EDITOR_BOARD ? log.entityId : null);

      if (boardId && typeof metadata.editorBoardName !== 'string') {
        boardIds.add(boardId);
      }

      if (log.action === ACTIVITY_ACTION.MEMBER_INVITED && !Array.isArray(metadata.invitedUsers)) {
        getNumberArray(metadata.invitedUserIds).forEach((id) => userIds.add(id));
      }

      if (log.action === ACTIVITY_ACTION.MEMBER_REMOVED && !isRecord(metadata.removedUser)) {
        const removedUserId = getNumber(metadata.removedUserId);
        if (removedUserId) {
          userIds.add(removedUserId);
        }
      }
    });

    const [boards, users] = await Promise.all([
      boardIds.size
        ? this.prisma.editorBoard.findMany({
            where: { id: { in: [...boardIds] } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      userIds.size
        ? this.prisma.user.findMany({
            where: { id: { in: [...userIds] } },
            select: { id: true, displayName: true, email: true },
          })
        : Promise.resolve([]),
    ]);

    const boardMap = new Map(boards.map((board) => [board.id, board.name] as const));
    const userMap = new Map(users.map((user) => [user.id, user] as const));

    return logs.map((log) => {
      const metadata = isRecord(log.metadata) ? { ...log.metadata } : {};
      const boardId = log.editorBoardId ?? (log.entityType === ENTITY_TYPE.EDITOR_BOARD ? log.entityId : null);

      if (boardId && typeof metadata.editorBoardName !== 'string') {
        const boardName = boardMap.get(boardId);
        if (boardName) {
          metadata.editorBoardName = boardName;
        }
      }

      if (log.action === ACTIVITY_ACTION.MEMBER_INVITED && !Array.isArray(metadata.invitedUsers)) {
        const invitedUsers = getNumberArray(metadata.invitedUserIds)
          .map((id) => userMap.get(id))
          .filter((user): user is NonNullable<typeof user> => Boolean(user));

        if (invitedUsers.length > 0) {
          metadata.invitedUsers = invitedUsers;
        }
      }

      if (log.action === ACTIVITY_ACTION.MEMBER_REMOVED && !isRecord(metadata.removedUser)) {
        const removedUserId = getNumber(metadata.removedUserId);
        const removedUser = removedUserId ? userMap.get(removedUserId) : null;

        if (removedUser) {
          metadata.removedUser = removedUser;
        }
      }

      return {
        ...log,
        metadata: Object.keys(metadata).length > 0 ? (metadata as Prisma.JsonObject) : log.metadata,
      };
    });
  }
}
