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

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFileById(id: number) {
    try {
      return await this.ensureFile(id);
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

  async getFileMaterials(fileId: number) {
    try {
      await this.ensureFile(fileId);

      const material = await this.prisma.fileMaterial.findFirst({
        where: { fileId },
        orderBy: { createdAt: 'desc' },
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
        },
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
      parentId?: number;
      assignedBy?: number;
      userId: number;
    },
  ) {
    try {
      await this.ensureFile(fileId);

      return await this.prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          status: data.status || PROGRESS_STATUS.PENDING,
          parentId: data.parentId,
          fileId,
          assignedBy: data.assignedBy,
          createdBy: data.userId,
        },
      });
    } catch (error) {
      this.handleError(error, 'Create task fail', ERROR.SVCREATETASK);
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
