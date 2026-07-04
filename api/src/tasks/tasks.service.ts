import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PROGRESS_STATUS, Prisma, ACTIVITY_ACTION, ENTITY_TYPE } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACTIVITY_EVENT_NAME, ActivityEventPayload } from '../share/events/activity.event';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import type { Pagination } from '../share/interfaces';
import { CacheService } from '../redis/cache.service';
import { UseCache, InvalidateCache } from '../share/decorators/cache.decorator';

const USER_SELECT = {
  select: {
    id: true,
    email: true,
    displayName: true,
    avatarUrl: true,
  },
};

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  deadline: true,
  parentId: true,
  fileId: true,
  file: {
    select: {
      id: true,
      title: true,
    },
  },
  parent: {
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
    },
  },
  assignedByUser: USER_SELECT,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaskSelect;

const COMMENT_SELECT = {
  id: true,
  content: true,
  frameId: true,
  createdByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
  ) {}

  @UseCache((args) => `task:${args[0]}`)
  async getTaskById(id: number) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id },
        select: TASK_SELECT,
      });
      if (!task) {
        throw new NotFoundException(ERROR.NFTASK);
      }
      return task;
    } catch (error) {
      this.handleError(error, 'Get task fail', ERROR.SVGETTASK);
    }
  }

  @InvalidateCache((args) => [`task:${args[0]}`, `task:list:*`, `file:*:tasks:*`])
  async updateTask(
    id: number,
    data: {
      title?: string;
      description?: string;
      status?: PROGRESS_STATUS;
      deadline?: Date;
      parentId?: number;
      assignedBy?: number;
      userId: number;
    },
  ) {
    try {
      const task = await this.ensureTask(id);

      // Subtask dependency validation:
      // A subtask cannot change status from PENDING until parent task is DONE
      if (data.status && data.status !== PROGRESS_STATUS.PENDING && task.parentId) {
        const parentTask = await this.prisma.task.findUnique({
          where: { id: task.parentId },
          select: { status: true },
        });
        if (parentTask && parentTask.status !== PROGRESS_STATUS.DONE) {
          throw new BadRequestException(ERROR.EVLSUBTASKDEP);
        }
      }

      const updatedTask = await this.prisma.task.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          deadline: data.deadline,
          parentId: data.parentId,
          assignedBy: data.assignedBy,
          updatedBy: data.userId,
        },
        select: TASK_SELECT,
      });

      const fileWithFolder = await this.prisma.file.findUnique({
        where: { id: updatedTask.fileId },
        include: { folder: true },
      });

      if (data.assignedBy !== undefined && data.assignedBy !== task.assignedBy) {
        this.eventEmitter.emit(ACTIVITY_EVENT_NAME, {
          action: ACTIVITY_ACTION.TASK_ASSIGNED,
          entityType: ENTITY_TYPE.TASK,
          entityId: updatedTask.id,
          projectId: fileWithFolder?.folder?.projectId ?? null,
          fileId: updatedTask.fileId,
          actorId: data.userId,
          metadata: {
            title: updatedTask.title,
            assignedTo: updatedTask.assignedByUser?.id,
          },
        } satisfies ActivityEventPayload);
      }

      if (data.status !== undefined && data.status !== task.status) {
        this.eventEmitter.emit(ACTIVITY_EVENT_NAME, {
          action: data.status === PROGRESS_STATUS.DONE ? ACTIVITY_ACTION.TASK_COMPLETED : ACTIVITY_ACTION.TASK_UPDATED,
          entityType: ENTITY_TYPE.TASK,
          entityId: updatedTask.id,
          projectId: fileWithFolder?.folder?.projectId ?? null,
          fileId: updatedTask.fileId,
          actorId: data.userId,
          metadata: {
            title: updatedTask.title,
            status: updatedTask.status,
            assigneeId: updatedTask.assignedByUser?.id,
            creatorId: updatedTask.createdByUser?.id,
          },
        } satisfies ActivityEventPayload);
      }

      return updatedTask;
    } catch (error) {
      this.handleError(error, 'Update task fail', ERROR.SVUPDATETASK);
    }
  }

  @InvalidateCache((args) => [`task:${args[0]}`, `task:list:*`, `file:*:tasks:*`])
  async deleteTask(id: number) {
    try {
      await this.ensureTask(id);
      await this.prisma.task.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete task fail', ERROR.SVDELETETASK);
    }
  }

  @UseCache((args) => `task:${args[0]}:children`)
  async getTaskChildren(
    taskId: number,
    filter?: {
      search?: string;
      status?: PROGRESS_STATUS;
    },
    sort?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureTask(taskId);

      const where: Prisma.TaskWhereInput = {
        parentId: taskId,
        ...(filter?.search && { title: { contains: filter.search, mode: 'insensitive' } }),
        ...(filter?.status && { status: filter.status }),
      };
      const orderBy: Prisma.TaskOrderByWithRelationInput = sort
        ? { [sort.field]: sort.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, tasks] = await this.prisma.$transaction([
        this.prisma.task.count({ where }),
        this.prisma.task.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: TASK_SELECT,
        }),
      ]);

      return {
        tasks,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get task children fail', ERROR.SVGETTASKCHILDREN);
    }
  }



  @UseCache((args) => `task:list:${args[0]}`)
  async getMyTasks(
    userId: number,
    filter?: {
      search?: string;
      status?: PROGRESS_STATUS;
    },
    sort?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      const where: Prisma.TaskWhereInput = {
        assignedBy: userId,
        ...(filter?.search && { title: { contains: filter.search, mode: 'insensitive' } }),
        ...(filter?.status && { status: filter.status }),
      };
      const orderBy: Prisma.TaskOrderByWithRelationInput = sort
        ? { [sort.field]: sort.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, tasks] = await this.prisma.$transaction([
        this.prisma.task.count({ where }),
        this.prisma.task.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: TASK_SELECT,
        }),
      ]);

      return {
        tasks,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get my tasks fail', ERROR.SVGETTASK);
    }
  }

  @UseCache((args) => `task:${args[0]}:frames`)
  async getTaskFrames(
    taskId: number,
    sort?: { field: 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureTask(taskId);

      const where: Prisma.MaterialCommentFrameWhereInput = {
        material: {
          taskId,
        },
      };
      const orderBy: Prisma.MaterialCommentFrameOrderByWithRelationInput = sort
        ? { [sort.field]: sort.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, frames] = await this.prisma.$transaction([
        this.prisma.materialCommentFrame.count({ where }),
        this.prisma.materialCommentFrame.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            startX: true,
            startY: true,
            endX: true,
            endY: true,
            materialId: true,
            createdByUser: USER_SELECT,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      return {
        frames,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get task frames fail', 'SVGETTASKFRAMES');
    }
  }

  @UseCache((args) => `task:${args[0]}:comments`)
  async getTaskComments(
    taskId: number,
    sort?: { field: 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureTask(taskId);

      const where: Prisma.CommentWhereInput = {
        OR: [
          { taskId },
          {
            frame: {
              material: {
                taskId,
              },
            },
          },
        ],
      };
      const orderBy: Prisma.CommentOrderByWithRelationInput = sort
        ? { [sort.field]: sort.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, comments] = await this.prisma.$transaction([
        this.prisma.comment.count({ where }),
        this.prisma.comment.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            content: true,
            taskId: true,
            frameId: true,
            frame: {
              select: {
                id: true,
                name: true,
                material: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            createdByUser: {
              select: { id: true, email: true, displayName: true, avatarUrl: true },
            },
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      const mappedComments = comments.map(c => {
        const material = c.frame?.material;
        const frame = c.frame ? { id: c.frame.id, name: c.frame.name } : null;
        return {
          ...c,
          frame,
          material,
        };
      });

      return {
        comments: mappedComments,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get task comments fail', 'SVGETTASKCOMMENTS');
    }
  }

  @InvalidateCache((args) => [`task:${args[0]}:comments:*`])
  async createComment(
    taskId: number,
    data: {
      content: unknown;
      userId: number;
      mentionedUserIds?: number[];
    },
  ) {
    try {
      await this.ensureTask(taskId);

      const taskObj = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: { file: { include: { folder: true } } },
      });

      const comment = await this.prisma.comment.create({
        data: {
          content: data.content as Prisma.InputJsonValue,
          taskId,
          createdBy: data.userId,
        },
        select: {
          id: true,
          content: true,
          taskId: true,
          createdByUser: {
            select: { id: true, email: true, displayName: true, avatarUrl: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      this.eventEmitter.emit(ACTIVITY_EVENT_NAME, {
        action: ACTIVITY_ACTION.COMMENT_CREATED,
        entityType: ENTITY_TYPE.COMMENT,
        entityId: comment.id,
        projectId: taskObj?.file?.folder?.projectId ?? null,
        fileId: taskObj?.file?.id ?? null,
        actorId: data.userId,
        metadata: {
          taskId,
          taskTitle: taskObj?.title,
          assigneeId: taskObj?.assignedBy,
          creatorId: taskObj?.createdBy,
          mentionedUserIds: data.mentionedUserIds || [],
        },
      } satisfies ActivityEventPayload);

      return comment;
    } catch (error) {
      this.handleError(error, 'Create comment fail', 'SVCREATECOMMENT');
    }
  }

  @UseCache((args) => `task:${args[0]}:materials-select`)
  async getTaskMaterialsForSelect(taskId: number) {
    try {
      await this.ensureTask(taskId);

      const materials = await this.prisma.fileMaterial.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' },
      });

      return materials.map((m) => {
        let displayName = m.name;
        if (!displayName && Array.isArray(m.materials) && m.materials.length > 0) {
          displayName = (m.materials[0] as any).originalName;
        }
        return {
          id: m.id,
          name: displayName || `Material #${m.id}`,
        };
      });
    } catch (error) {
      this.handleError(error, 'Get task materials for select fail', ERROR.SVGETTASK);
    }
  }

  private buildPagination(pagination?: Pagination) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    return {
      page,
      limit,
      skip: (page - 1) * limit,
    };
  }

  private buildPaginationMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private async ensureTask(id: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(ERROR.NFTASK);
    }
    return task;
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
