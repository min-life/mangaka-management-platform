import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      const target = exception.meta?.target as string[];
      if (target && target.length > 0) {
        message = `Resource with this ${target.join(', ')} already exists.`;
        code = `CONFLICT_${target.join('_').toUpperCase()}`;
      } else {
        message = 'Unique constraint failed. Resource already exists.';
        code = 'CONFLICT_RESOURCE';
      }
    } else if (exception.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      message = 'Resource not found.';
      code = 'NOT_FOUND';
    } else {
      this.logger.error(`Prisma Error: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
