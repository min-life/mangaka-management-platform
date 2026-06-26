import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { APPLICATION_STATUS, APPLICATION_TYPE, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import type { Pagination } from '../share/interfaces';

const PROJECT_SELECT = {
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
      createdByUser: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      updatedByUser: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  updatedByUser: {
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

const APPLICATION_SELECT = {
  id: true,
  project: {
    select: PROJECT_SELECT,
  },
  title: true,
  description: true,
  materials: true,
  type: true,
  status: true,
  verifiedByUser: {
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  updatedByUser: {
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ApplicationSelect;

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getApplications(
    filter?: {
      projectId?: number;
      search?: string;
      type?: APPLICATION_TYPE;
      status?: APPLICATION_STATUS;
    },
    sort?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      const where: Prisma.ApplicationWhereInput = {
        ...(filter?.projectId && { projectId: filter.projectId }),
        ...(filter?.search && { title: { contains: filter.search, mode: 'insensitive' } }),
        ...(filter?.type && { type: filter.type }),
        ...(filter?.status && { status: filter.status }),
      };
      const orderBy: Prisma.ApplicationOrderByWithRelationInput = sort
        ? { [sort.field]: sort.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, applications] = await this.prisma.$transaction([
        this.prisma.application.count({ where }),
        this.prisma.application.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: APPLICATION_SELECT,
        }),
      ]);

      return {
        applications,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get applications fail', ERROR.SVGETPROJECTAPPLICATIONS);
    }
  }

  async getApplicationById(id: number) {
    try {
      const application = await this.prisma.application.findUnique({
        where: { id },
        select: APPLICATION_SELECT,
      });
      if (!application) {
        throw new NotFoundException(ERROR.NFAPPLICATION);
      }
      return application;
    } catch (error) {
      this.handleError(error, 'Get application fail', ERROR.SVGETAPPLICATION);
    }
  }

  async updateApplication(
    id: number,
    data: {
      title?: string;
      description?: string;
      materials?: unknown;
      userId: number;
    },
  ) {
    try {
      await this.ensureApplication(id);

      return await this.prisma.application.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          materials: data.materials as Prisma.InputJsonValue,
          updatedBy: data.userId,
        },
        select: APPLICATION_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update application fail', ERROR.SVUPDATEAPPLICATION);
    }
  }

  async deleteApplication(id: number) {
    try {
      await this.ensureApplication(id);
      await this.prisma.application.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete application fail', ERROR.SVDELETEAPPLICATION);
    }
  }

  async updateApplicationStatus(
    id: number,
    data: {
      status: APPLICATION_STATUS;
      userId: number;
    },
  ) {
    try {
      await this.ensureApplication(id);

      return await this.prisma.application.update({
        where: { id },
        data: {
          status: data.status,
          verifyBy: data.userId,
        },
        select: APPLICATION_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update application status fail', ERROR.SVUPDATEAPPLICATION);
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

  private async ensureApplication(id: number) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundException(ERROR.NFAPPLICATION);
    }
    return application;
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
