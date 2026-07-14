import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { HttpException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CacheService } from '../redis/cache.service';
import { InvalidateCache } from '../share/decorators/cache.decorator';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async ensureComment(id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });
    if (!comment) {
      throw new NotFoundException(ERROR.NFCOMMENT || 'Comment not found');
    }
    return comment;
  }

  private getCommentContext(comment: any): { entityType: string; entityId: number } | null {
    if (comment.taskId) return { entityType: 'TASK', entityId: comment.taskId };
    if (comment.fileId) return { entityType: 'FILE', entityId: comment.fileId };
    if (comment.frameId) return { entityType: 'FRAME', entityId: comment.frameId };
    if (comment.applicationId) return { entityType: 'APPLICATION', entityId: comment.applicationId };
    return null;
  }

  @InvalidateCache((args) => [`task:*:comments:*`, `frame:*:comments:*`, `file:*:comments:*`])
  async updateComment(id: number, data: { content?: string }) {
    try {
      await this.ensureComment(id);
      const updated = await this.prisma.comment.update({
        where: { id },
        data: {
          content: data.content,
        },
        include: {
          createdByUser: {
            select: { id: true, email: true, displayName: true, avatarUrl: true },
          },
        },
      });

      const context = this.getCommentContext(updated);
      if (context) {
        this.realtimeGateway.broadcastComment(
          context.entityType,
          context.entityId,
          'comment:updated',
          updated,
        );
      }

      return updated;
    } catch (error) {
      this.handleError(error, 'Update comment fail', 'SVUPDATECOMMENT');
    }
  }

  @InvalidateCache((args) => [`task:*:comments:*`, `frame:*:comments:*`, `file:*:comments:*`])
  async deleteComment(id: number) {
    try {
      const comment = await this.ensureComment(id);
      const deleted = await this.prisma.comment.delete({
        where: { id },
      });

      const context = this.getCommentContext(comment);
      if (context) {
        this.realtimeGateway.broadcastComment(
          context.entityType,
          context.entityId,
          'comment:deleted',
          { id: deleted.id },
        );
      }

      return deleted;
    } catch (error) {
      this.handleError(error, 'Delete comment fail', 'SVDELETECOMMENT');
    }
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
