import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import type { Pagination } from '../share/interfaces';

@Injectable()
export class FramesService {
  private readonly logger = new Logger(FramesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFrameById(id: number) {
    try {
      return await this.ensureFrame(id);
    } catch (error) {
      this.handleError(error, 'Get frame fail', ERROR.SVGETFRAME);
    }
  }

  async updateFrame(
    id: number,
    data: {
      startX?: number;
      startY?: number;
      endX?: number;
      endY?: number;
      userId: number;
    },
  ) {
    try {
      await this.ensureFrame(id);

      return await this.prisma.taskCommentFrame.update({
        where: { id },
        data: {
          startX: data.startX,
          startY: data.startY,
          endX: data.endX,
          endY: data.endY,
          updatedBy: data.userId,
        },
      });
    } catch (error) {
      this.handleError(error, 'Update frame fail', ERROR.SVUPDATEFRAME);
    }
  }

  async deleteFrame(id: number) {
    try {
      await this.ensureFrame(id);
      await this.prisma.taskCommentFrame.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete frame fail', ERROR.SVDELETEFRAME);
    }
  }

  async getFrameComments(
    frameId: number,
    sort?: { field: 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureFrame(frameId);

      const where: Prisma.TaskCommentWhereInput = { frameId };
      const orderBy: Prisma.TaskCommentOrderByWithRelationInput = sort
        ? { [sort.field]: sort.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, comments] = await this.prisma.$transaction([
        this.prisma.taskComment.count({ where }),
        this.prisma.taskComment.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
      ]);

      return {
        comments,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get frame comments fail', ERROR.SVGETFRAMECOMMENTS);
    }
  }

  async createComment(
    frameId: number,
    data: {
      content: unknown;
      userId: number;
    },
  ) {
    try {
      await this.ensureFrame(frameId);

      return await this.prisma.taskComment.create({
        data: {
          content: data.content as Prisma.InputJsonValue,
          frameId,
          createdBy: data.userId,
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

  private async ensureFrame(id: number) {
    const frame = await this.prisma.taskCommentFrame.findUnique({ where: { id } });
    if (!frame) {
      throw new NotFoundException(ERROR.NFFRAME);
    }
    return frame;
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
