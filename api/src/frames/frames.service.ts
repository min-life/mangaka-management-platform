import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ACTIVITY_ACTION, ENTITY_TYPE } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import type { Pagination } from '../share/interfaces';
import { ACTIVITY_EVENT_NAME, ActivityEventPayload } from '../share/events/activity.event';
import { RealtimeGateway } from '../realtime/realtime.gateway';
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

const FRAME_SELECT = {
  id: true,
  startX: true,
  startY: true,
  endX: true,
  endY: true,
  name: true,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

const COMMENT_SELECT = {
  id: true,
  content: true,
  frameId: true,
  taskId: true,
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
  createdByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class FramesService {
  private readonly logger = new Logger(FramesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly cacheService: CacheService,
  ) {}

  @UseCache((args) => `frame:${args[0]}`)
  async getFrameById(id: number) {
    try {
      return await this.ensureFrame(id);
    } catch (error) {
      this.handleError(error, 'Get frame fail', ERROR.SVGETFRAME);
    }
  }

  @UseCache((args) => `material:${args[0]}:frames`)
  async getMaterialFrames(
    materialId: number,
    sort?: { field: 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      const material = await this.prisma.fileMaterial.findUnique({
        where: { id: materialId },
      });
      if (!material) {
        throw new NotFoundException(ERROR.NFMATERIAL);
      }

      const where: Prisma.MaterialCommentFrameWhereInput = { materialId };
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
          select: FRAME_SELECT,
        }),
      ]);

      return {
        frames,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get material frames fail', 'SVGETMATERIALFRAMES');
    }
  }

  @InvalidateCache((args) => [`material:${args[0]}:frames:*`, `task:*:frames:*`])
  async createFrame(
    materialId: number,
    data: {
      name?: string;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      userId: number;
    },
  ) {
    try {
      const material = await this.prisma.fileMaterial.findUnique({
        where: { id: materialId },
      });
      if (!material) {
        throw new NotFoundException(ERROR.NFMATERIAL);
      }

      return await this.prisma.materialCommentFrame.create({
        data: {
          name: data.name,
          startX: data.startX,
          startY: data.startY,
          endX: data.endX,
          endY: data.endY,
          materialId,
          createdBy: data.userId,
          updatedBy: data.userId,
        },
        select: FRAME_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Create frame fail', 'SVCREATEFRAME');
    }
  }

  @InvalidateCache((args) => [`frame:${args[0]}`, `material:*:frames:*`, `task:*:frames:*`])
  async updateFrame(
    id: number,
    data: {
      name?: string;
      startX?: number;
      startY?: number;
      endX?: number;
      endY?: number;
      userId: number;
    },
  ) {
    try {
      await this.ensureFrame(id);

      return await this.prisma.materialCommentFrame.update({
        where: { id },
        data: {
          name: data.name,
          startX: data.startX,
          startY: data.startY,
          endX: data.endX,
          endY: data.endY,
          updatedBy: data.userId,
        },
        select: FRAME_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update frame fail', ERROR.SVUPDATEFRAME);
    }
  }

  @InvalidateCache((args) => [`frame:${args[0]}`, `material:*:frames:*`, `task:*:frames:*`])
  async deleteFrame(id: number) {
    try {
      await this.ensureFrame(id);
      await this.prisma.materialCommentFrame.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete frame fail', ERROR.SVDELETEFRAME);
    }
  }

  @UseCache((args) => `frame:${args[0]}:comments`)
  async getFrameComments(
    frameId: number,
    sort?: { field: 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureFrame(frameId);

      const where: Prisma.CommentWhereInput = { frameId };
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
          select: COMMENT_SELECT,
        }),
      ]);

      const mappedComments = comments.map((c) => {
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
      this.handleError(error, 'Get frame comments fail', ERROR.SVGETFRAMECOMMENTS);
    }
  }

  @InvalidateCache((args) => [`frame:${args[0]}:comments:*`, `task:*:comments:*`])
  async createComment(
    frameId: number,
    data: {
      content: unknown;
      userId: number;
      mentionedUserIds?: number[];
    },
  ) {
    try {
      await this.ensureFrame(frameId);

      const frameObj = await this.prisma.materialCommentFrame.findUnique({
        where: { id: frameId },
        include: { material: { include: { file: { include: { folder: true } } } } },
      });

      const comment = await this.prisma.comment.create({
        data: {
          content: data.content as Prisma.InputJsonValue,
          frameId,
          createdBy: data.userId,
        },
        select: {
          id: true,
          content: true,
          frameId: true,
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
        projectId: frameObj?.material?.file?.folder?.projectId ?? null,
        fileId: frameObj?.material?.file?.id ?? null,
        actorId: data.userId,
        metadata: {
          frameId,
          creatorId: frameObj?.createdBy,
          mentionedUserIds: data.mentionedUserIds || [],
        },
      } satisfies ActivityEventPayload);

      this.realtimeGateway.broadcastComment('FRAME', frameId, 'comment:new', comment);

      return comment;
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
    const frame = await this.prisma.materialCommentFrame.findUnique({
      where: { id },
      select: FRAME_SELECT,
    });
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
