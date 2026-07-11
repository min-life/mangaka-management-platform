import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  APPLICATION_STATUS,
  APPLICATION_TYPE,
  Prisma,
  ACTIVITY_ACTION,
  ENTITY_TYPE,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACTIVITY_EVENT_NAME, ActivityEventPayload } from '../share/events/activity.event';
import { ERROR } from '../share/constants/message-error';
import type { Pagination } from '../share/interfaces';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CacheService } from '../redis/cache.service';
import { UseCache, InvalidateCache } from '../share/decorators/cache.decorator';

const USER_BASIC_SELECT = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
};

const PROJECT_BASIC_SELECT = {
  id: true,
  name: true,
  imageUrl: true,
};

const PROJECT_DETAIL_SELECT = {
  ...PROJECT_BASIC_SELECT,
  description: true,
  editorBoard: {
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

const APPLICATION_LIST_SELECT = {
  id: true,
  projectId: true,
  title: true,
  type: true,
  status: true,
  parentFolderId: true,
  folderImageUrl: true,
  project: {
    select: PROJECT_BASIC_SELECT,
  },
  verifiedByUser: {
    select: USER_BASIC_SELECT,
  },
  createdByUser: {
    select: USER_BASIC_SELECT,
  },
  updatedByUser: {
    select: USER_BASIC_SELECT,
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ApplicationSelect;

const APPLICATION_SELECT = {
  ...APPLICATION_LIST_SELECT,
  description: true,
  materials: true,
  project: {
    select: PROJECT_BASIC_SELECT,
  },
} satisfies Prisma.ApplicationSelect;

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly cacheService: CacheService,
  ) {}

  @UseCache((args) => `application:list`)
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
          select: APPLICATION_LIST_SELECT,
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

  @UseCache((args) => `application:${args[0]}`)
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

  @InvalidateCache((args) => [
    `application:${args[0]}`,
    `application:list:*`,
    `project:*:applications:*`,
  ])
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

  async addApplicationMaterial(id: number, userId: number, materialItem: any) {
    try {
      const application = await this.ensureApplication(id);
      const materialsArray = [...((application.materials as any[]) || [])];

      materialsArray.push(materialItem);

      return await this.prisma.application.update({
        where: { id },
        data: {
          materials: materialsArray as Prisma.InputJsonArray,
          updatedBy: userId,
        },
        select: APPLICATION_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Add application material fail', ERROR.SVUPDATEAPPLICATION);
    }
  }

  @InvalidateCache((args) => [
    `application:${args[0]}`,
    `application:list:*`,
    `project:*:applications:*`,
  ])
  async updateApplicationMaterial(id: number, userId: number, index: number, materialItem: any) {
    try {
      const application = await this.ensureApplication(id);
      const materialsArray = [...((application.materials as any[]) || [])];

      if (index >= 0 && index < materialsArray.length) {
        materialsArray[index] = { ...materialsArray[index], ...materialItem };
      }

      return await this.prisma.application.update({
        where: { id },
        data: {
          materials: materialsArray as Prisma.InputJsonArray,
          updatedBy: userId,
        },
        select: APPLICATION_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update application material fail', ERROR.SVUPDATEAPPLICATION);
    }
  }

  @InvalidateCache((args) => [
    `application:${args[0]}`,
    `application:list:*`,
    `project:*:applications:*`,
  ])
  async deleteApplicationMaterial(id: number, userId: number, index: number) {
    try {
      const application = await this.ensureApplication(id);
      const materialsArray = [...((application.materials as any[]) || [])];

      if (index >= 0 && index < materialsArray.length) {
        materialsArray.splice(index, 1);
      }

      return await this.prisma.application.update({
        where: { id },
        data: {
          materials: materialsArray as Prisma.InputJsonArray,
          updatedBy: userId,
        },
        select: APPLICATION_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Delete application material fail', ERROR.SVUPDATEAPPLICATION);
    }
  }

  @InvalidateCache((args) => [
    `application:${args[0]}`,
    `application:list:*`,
    `project:*:applications:*`,
  ])
  async deleteApplication(id: number) {
    try {
      await this.ensureApplication(id);
      await this.prisma.application.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete application fail', ERROR.SVDELETEAPPLICATION);
    }
  }

  @InvalidateCache((args) => [
    `application:${args[0]}`,
    `application:list:*`,
    `project:*:applications:*`,
  ])
  async updateApplicationStatus(
    id: number,
    data: {
      status: APPLICATION_STATUS;
      userId: number;
      voteDeadline?: string;
      comment?: string;
    },
  ) {
    try {
      const application = await this.ensureApplication(id);

      // Perform two-stage permission validation for folder creation applications
      const permissions = await this.usersService.getUserPermissions(
        data.userId,
        'APPLICATION',
        id,
      );

      if (data.status === APPLICATION_STATUS.SUBMITTED) {
        if (
          application.status !== APPLICATION_STATUS.PENDING &&
          application.status !== APPLICATION_STATUS.SUBMITTED
        ) {
          throw new BadRequestException('Application status must be PENDING to submit');
        }
        if (application.status === APPLICATION_STATUS.PENDING) {
          if (!permissions.includes('board:leader') && !permissions.includes('board:owner')) {
            throw new ForbiddenException(
              'Only board leaders and owners can submit this application',
            );
          }
        }
        if (
          data.voteDeadline &&
          !permissions.includes('board:leader') &&
          !permissions.includes('board:owner')
        ) {
          throw new ForbiddenException('Only board leaders and owners can set a vote deadline');
        }
      } else if (data.status === APPLICATION_STATUS.APPROVE) {
        if (
          application.type === APPLICATION_TYPE.CREATE_ARC ||
          application.type === APPLICATION_TYPE.CREATE_CHAPTER
        ) {
          if (application.status !== APPLICATION_STATUS.SUBMITTED) {
            throw new BadRequestException(
              'Application must be SUBMITTED before board-level approval',
            );
          }
          if (!permissions.includes('board:leader') && !permissions.includes('board:owner')) {
            throw new ForbiddenException(
              'You do not have permission to perform board-level approval',
            );
          }
        }
      } else if (data.status === APPLICATION_STATUS.REJECT) {
        if (
          application.type === APPLICATION_TYPE.CREATE_ARC ||
          application.type === APPLICATION_TYPE.CREATE_CHAPTER
        ) {
          if (application.status === APPLICATION_STATUS.PENDING) {
            if (
              !permissions.includes('project:owner') &&
              !permissions.includes('project:application.approve')
            ) {
              throw new ForbiddenException(
                'You do not have permission to reject this application at project level',
              );
            }
          } else if (application.status === APPLICATION_STATUS.SUBMITTED) {
            if (!permissions.includes('board:leader') && !permissions.includes('board:owner')) {
              throw new ForbiddenException(
                'You do not have permission to reject this application at board level',
              );
            }
          } else {
            throw new BadRequestException('Cannot reject application in its current status');
          }
        }
      }

      const updateData: any = {
        status: data.status,
        verifyBy: data.userId,
      };

      if (data.status === APPLICATION_STATUS.SUBMITTED && data.voteDeadline) {
        updateData.voteDeadline = new Date(data.voteDeadline);
      }

      const updatedApp = await this.prisma.application.update({
        where: { id },
        data: updateData,
        select: APPLICATION_SELECT,
      });

      // Auto-create folder, file, and material if approved
      if (updatedApp.status === APPLICATION_STATUS.APPROVE) {
        if (
          application.type === APPLICATION_TYPE.CREATE_ARC ||
          application.type === APPLICATION_TYPE.CREATE_CHAPTER
        ) {
          const folderParentId =
            application.type === APPLICATION_TYPE.CREATE_CHAPTER
              ? application.parentFolderId
              : null;

          if (folderParentId) {
            const parentFolder = await this.prisma.folder.findUnique({
              where: { id: folderParentId },
            });
            if (!parentFolder || parentFolder.projectId !== application.projectId) {
              throw new NotFoundException(
                'Parent folder not found or does not belong to this project',
              );
            }
            if (parentFolder.parentId !== null) {
              throw new BadRequestException(
                'Cannot create a subfolder under a Chapter (maximum depth is 2)',
              );
            }
          }

          // Find thumbnail or first image URL from application materials
          let imageUrl: string | null = null;
          const materialsData = application.materials as any[];
          if (Array.isArray(materialsData)) {
            const thumbnail =
              materialsData.find((m) => m.isThumbnail) ||
              materialsData.find((m) => m.type === 'IMAGE') ||
              materialsData[0];
            if (thumbnail && thumbnail.url) {
              imageUrl = thumbnail.url;
            }
          }

          // Create Folder
          const folder = await this.prisma.folder.create({
            data: {
              projectId: application.projectId,
              title: application.title,
              description: application.description,
              parentId: folderParentId,
              imageUrl: application.folderImageUrl || imageUrl,
              createdBy: application.createdBy,
              updatedBy: application.createdBy,
            },
          });

          // Create File inside the Folder
          const file = await this.prisma.file.create({
            data: {
              title: application.title,
              description: application.description,
              folderId: folder.id,
              createdBy: application.createdBy,
              updatedBy: application.createdBy,
            },
          });

          // Create FileMaterial inside the File using the application's materials JSON
          await this.prisma.fileMaterial.create({
            data: {
              fileId: file.id,
              materials: application.materials as Prisma.InputJsonValue,
              createdBy: application.createdBy,
              updatedBy: application.createdBy,
            },
          });
        }
      }

      if (data.comment) {
        await this.createComment(id, {
          content: data.comment,
          userId: data.userId,
        });
      }

      let action: ACTIVITY_ACTION = ACTIVITY_ACTION.APPLICATION_SUBMITTED;
      if (data.status === APPLICATION_STATUS.APPROVE) action = ACTIVITY_ACTION.APPLICATION_APPROVED;
      else if (data.status === APPLICATION_STATUS.REJECT)
        action = ACTIVITY_ACTION.APPLICATION_REJECTED;
      else if (data.status === APPLICATION_STATUS.SUBMITTED)
        action = ACTIVITY_ACTION.APPLICATION_SUBMITTED;

      this.eventEmitter.emit(ACTIVITY_EVENT_NAME, {
        action,
        entityType: ENTITY_TYPE.APPLICATION,
        entityId: updatedApp.id,
        projectId: application.projectId,
        actorId: data.userId,
        metadata: {
          title: application.title,
          creatorId: application.createdBy,
        },
      } satisfies ActivityEventPayload);

      return updatedApp;
    } catch (error) {
      this.handleError(error, 'Update application status fail', ERROR.SVUPDATEAPPLICATION);
    }
  }

  @UseCache((args) => `application:${args[0]}:votes`)
  async getVotes(applicationId: number) {
    try {
      await this.ensureApplication(applicationId);

      const votes = await this.prisma.applicationVote.findMany({
        where: { applicationId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return { data: votes };
    } catch (error) {
      this.handleError(error, 'Get application votes fail', ERROR.SVGETVOTES);
    }
  }

  @InvalidateCache((args) => [`application:${args[0]}:votes:*`])
  async castVote(
    applicationId: number,
    userId: number,
    decision: import('@prisma/client').VOTE_DECISION,
    comment?: string,
  ) {
    try {
      const application = await this.ensureApplication(applicationId);

      if (application.status !== APPLICATION_STATUS.SUBMITTED) {
        throw new BadRequestException('Voting is only allowed when application is SUBMITTED');
      }

      if (!application.voteDeadline) {
        throw new BadRequestException(
          'Voting cannot start until a deadline is set by the board leader',
        );
      }

      if (new Date() > new Date(application.voteDeadline)) {
        throw new BadRequestException('The voting deadline has passed');
      }

      const vote = await this.prisma.applicationVote.upsert({
        where: {
          applicationId_userId: {
            applicationId,
            userId,
          },
        },
        update: {
          decision,
          comment,
        },
        create: {
          applicationId,
          userId,
          decision,
          comment,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      return { data: vote };
    } catch (error) {
      this.handleError(error, 'Cast application vote fail', ERROR.SVVOTE);
    }
  }

  @UseCache((args) => `application:${args[0]}:comments`)
  async getApplicationComments(
    applicationId: number,
    sort?: { field: 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureApplication(applicationId);

      const where: Prisma.CommentWhereInput = { applicationId };
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
            applicationId: true,
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
      this.handleError(error, 'Get application comments fail', 'SVGETAPPCOMMENTS');
    }
  }

  @InvalidateCache((args) => [`application:${args[0]}:comments:*`])
  async createComment(
    applicationId: number,
    data: {
      content: unknown;
      userId: number;
    },
  ) {
    try {
      const application = await this.ensureApplication(applicationId);
      const project = await this.prisma.project.findUnique({
        where: { id: application.projectId },
        select: { createdBy: true },
      });

      const comment = await this.prisma.comment.create({
        data: {
          content: data.content as Prisma.InputJsonValue,
          applicationId,
          createdBy: data.userId,
        },
        select: {
          id: true,
          content: true,
          applicationId: true,
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
        projectId: application.projectId,
        actorId: data.userId,
        metadata: {
          applicationId,
          applicationTitle: application.title,
          applicantId: application.createdBy,
          projectOwnerId: project?.createdBy,
        },
      } satisfies ActivityEventPayload);

      this.realtimeGateway.broadcastComment('APPLICATION', applicationId, 'comment:new', comment);

      return comment;
    } catch (error) {
      this.handleError(error, 'Create comment fail', 'SVCREATECOMMENT');
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
