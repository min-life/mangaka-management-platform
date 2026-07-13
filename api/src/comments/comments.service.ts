import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { HttpException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CacheService } from '../redis/cache.service';
import { InvalidateCache } from '../share/decorators/cache.decorator';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
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

  @InvalidateCache((args) => [`task:*:comments:*`, `frame:*:comments:*`, `file:*:comments:*`])
  async updateComment(id: number, data: { content?: string }) {
    try {
      await this.ensureComment(id);
      return await this.prisma.comment.update({
        where: { id },
        data: {
          content: data.content,
        },
      });
    } catch (error) {
      this.handleError(error, 'Update comment fail', 'SVUPDATECOMMENT');
    }
  }

  @InvalidateCache((args) => [`task:*:comments:*`, `frame:*:comments:*`, `file:*:comments:*`])
  async deleteComment(id: number) {
    try {
      await this.ensureComment(id);
      return await this.prisma.comment.delete({
        where: { id },
      });
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
