import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PROGRESS_STATUS, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import type { Pagination } from '../share/interfaces';

const USER_SELECT = {
  select: {
    id: true,
    email: true,
    displayName: true,
    avatarUrl: true,
  },
};

const FOLDER_SELECT = {
  id: true,
  title: true,
  description: true,
  project: {
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      editorBoard: {
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          createdByUser: USER_SELECT,
          updatedByUser: USER_SELECT,
          createdAt: true,
          updatedAt: true,
        },
      },
      createdByUser: USER_SELECT,
      updatedByUser: USER_SELECT,
      createdAt: true,
      updatedAt: true,
    },
  },
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

const FILE_SELECT = {
  id: true,
  title: true,
  description: true,
  folder: {
    select: FOLDER_SELECT,
  },
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  parent: {
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
    },
  },
  file: {
    select: FILE_SELECT,
  },
  assignedByUser: USER_SELECT,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

const FRAME_SELECT = {
  id: true,
  startX: true,
  startY: true,
  endX: true,
  endY: true,
  task: {
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
    },
  },
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

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

  constructor(private readonly prisma: PrismaService) {}

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

  async updateTask(
    id: number,
    data: {
      title?: string;
      description?: string;
      status?: PROGRESS_STATUS;
      parentId?: number;
      assignedBy?: number;
      userId: number;
    },
  ) {
    try {
      await this.ensureTask(id);

      return await this.prisma.task.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          parentId: data.parentId,
          assignedBy: data.assignedBy,
          updatedBy: data.userId,
        },
        select: TASK_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update task fail', ERROR.SVUPDATETASK);
    }
  }

  async deleteTask(id: number) {
    try {
      await this.ensureTask(id);
      await this.prisma.task.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete task fail', ERROR.SVDELETETASK);
    }
  }

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

  async getTaskFrames(
    taskId: number,
    sort?: { field: 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureTask(taskId);

      const where: Prisma.TaskCommentFrameWhereInput = { taskId };
      const orderBy: Prisma.TaskCommentFrameOrderByWithRelationInput = sort
        ? { [sort.field]: sort.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, frames] = await this.prisma.$transaction([
        this.prisma.taskCommentFrame.count({ where }),
        this.prisma.taskCommentFrame.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: FRAME_SELECT,
        }),
      ]);

      return {
        frames,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get task frames fail', ERROR.SVGETTASKFRAMES);
    }
  }

  async createFrame(
    taskId: number,
    data: {
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      userId: number;
    },
  ) {
    try {
      await this.ensureTask(taskId);

      return await this.prisma.taskCommentFrame.create({
        data: {
          startX: data.startX,
          startY: data.startY,
          endX: data.endX,
          endY: data.endY,
          taskId,
          createdBy: data.userId,
        },
        select: FRAME_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Create frame fail', ERROR.SVCREATEFRAME);
    }
  }

  async getTaskComments(taskId: number, pagination?: Pagination) {
    try {
      await this.ensureTask(taskId);

      const frames = await this.prisma.taskCommentFrame.findMany({
        where: { taskId },
        select: { id: true },
      });

      const frameIds = frames.map((f) => f.id);

      const where: Prisma.TaskCommentWhereInput = { frameId: { in: frameIds } };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, comments] = await this.prisma.$transaction([
        this.prisma.taskComment.count({ where }),
        this.prisma.taskComment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: COMMENT_SELECT,
        }),
      ]);

      return {
        comments,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get task comments fail', ERROR.SVGETTASKCOMMENTS);
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
