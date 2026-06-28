import {
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

const USER_SELECT = {
  select: {
    id: true,
    email: true,
    displayName: true,
    avatarUrl: true,
  },
};

const PROJECT_BASIC_SELECT = {
  id: true,
  name: true,
  imageUrl: true,
};

const FILE_SELECT = {
  id: true,
  title: true,
  description: true,
  folder: {
    select: {
      id: true,
      title: true,
      description: true,
      project: {
        select: PROJECT_BASIC_SELECT,
      },
    },
  },
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

export const MATERIAL_LIST_SELECT = {
  id: true,
  materials: true,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

const MATERIAL_SELECT = {
  ...MATERIAL_LIST_SELECT,
  file: {
    select: FILE_SELECT,
  },
};

export const TASK_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  deadline: true,
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
};

const TASK_SELECT = {
  ...TASK_LIST_SELECT,
  file: {
    select: FILE_SELECT,
  },
};

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getFileById(id: number) {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id },
        select: FILE_SELECT,
      });
      if (!file) {
        throw new NotFoundException(ERROR.NFFILE);
      }
      return file;
    } catch (error) {
      this.handleError(error, 'Get file fail', ERROR.SVGETFILE);
    }
  }

  async updateFile(
    id: number,
    data: {
      title?: string;
      description?: string;
      userId: number;
    },
  ) {
    try {
      await this.ensureFile(id);

      return await this.prisma.file.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          updatedBy: data.userId,
        },
        select: FILE_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update file fail', ERROR.SVUPDATEFILE);
    }
  }

  async deleteFile(id: number) {
    try {
      await this.ensureFile(id);
      await this.prisma.file.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete file fail', ERROR.SVDELETEFILE);
    }
  }

  async getFileMaterialVersions(fileId: number, pagination?: Pagination) {
    try {
      await this.ensureFile(fileId);

      const where: Prisma.FileMaterialWhereInput = { fileId };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, versions] = await this.prisma.$transaction([
        this.prisma.fileMaterial.count({ where }),
        this.prisma.fileMaterial.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: MATERIAL_LIST_SELECT,
        }),
      ]);

      return {
        versions,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get file material versions fail', ERROR.SVGETFILEMATERIALS);
    }
  }

  async getFileMaterials(fileId: number) {
    try {
      await this.ensureFile(fileId);

      const material = await this.prisma.fileMaterial.findFirst({
        where: { fileId },
        orderBy: { createdAt: 'desc' },
        select: MATERIAL_SELECT,
      });

      return material;
    } catch (error) {
      this.handleError(error, 'Get file materials fail', ERROR.SVGETFILEMATERIALS);
    }
  }

  async createMaterial(
    fileId: number,
    data: {
      materials: unknown;
      userId: number;
    },
  ) {
    try {
      await this.ensureFile(fileId);

      return await this.prisma.fileMaterial.create({
        data: {
          materials: data.materials as Prisma.InputJsonValue,
          fileId,
          createdBy: data.userId,
          updatedBy: data.userId,
        },
        select: MATERIAL_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Create material fail', ERROR.SVCREATEMATERIAL);
    }
  }

  async getFileTasks(
    fileId: number,
    filter?: {
      search?: string;
      status?: PROGRESS_STATUS;
    },
    sort?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureFile(fileId);

      const where: Prisma.TaskWhereInput = {
        fileId,
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
          select: TASK_LIST_SELECT,
        }),
      ]);

      return {
        tasks,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get file tasks fail', ERROR.SVGETFILETASKS);
    }
  }

  async createTask(
    fileId: number,
    data: {
      title: string;
      description?: string;
      status?: PROGRESS_STATUS;
      deadline?: Date;
      parentId?: number;
      assignedBy?: number;
      userId: number;
    },
  ) {
    try {
      await this.ensureFile(fileId);

      const task = await this.prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          status: data.status || PROGRESS_STATUS.PENDING,
          deadline: data.deadline,
          parentId: data.parentId,
          fileId,
          assignedBy: data.assignedBy,
          createdBy: data.userId,
          updatedBy: data.userId,
        },
        select: TASK_SELECT,
      });

      this.eventEmitter.emit(ACTIVITY_EVENT_NAME, {
        action: ACTIVITY_ACTION.TASK_CREATED,
        entityType: ENTITY_TYPE.TASK,
        entityId: task.id,
        actorId: data.userId,
        metadata: { title: task.title, assignedBy: task.assignedByUser?.id ?? null },
      } satisfies ActivityEventPayload);

      return task;
    } catch (error) {
      this.handleError(error, 'Create task fail', ERROR.SVCREATETASK);
    }
  }

  async getFileComments(
    fileId: number,
    sort?: { field: 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureFile(fileId);

      const where: Prisma.CommentWhereInput = { fileId };
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
            fileId: true,
            createdByUser: {
              select: { id: true, email: true, displayName: true, avatarUrl: true },
            },
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      return {
        comments,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get file comments fail', 'SVGETFILECOMMENTS');
    }
  }

  async createComment(
    fileId: number,
    data: {
      content: unknown;
      userId: number;
    },
  ) {
    try {
      await this.ensureFile(fileId);

      return await this.prisma.comment.create({
        data: {
          content: data.content as Prisma.InputJsonValue,
          fileId,
          createdBy: data.userId,
        },
        select: {
          id: true,
          content: true,
          fileId: true,
          createdByUser: {
            select: { id: true, email: true, displayName: true, avatarUrl: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      this.handleError(error, 'Create comment fail', ERROR.SVCREATECOMMENT);
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

  private async ensureFile(id: number) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundException(ERROR.NFFILE);
    }
    return file;
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
