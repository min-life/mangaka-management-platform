import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { APPLICATION_STATUS, APPLICATION_TYPE, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import type { Pagination } from '../share/interfaces';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACTIVITY_EVENT_NAME, ActivityEventPayload } from '../share/events/activity.event';
import { ACTIVITY_ACTION, ENTITY_TYPE } from '@prisma/client';
import type { FilterBoards, OrderBoards } from './interfaces/get-editor-boards.interface';
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

const BOARD_MEMBER_SELECT = {
  user: USER_SELECT,
  isLead: true,
} satisfies Prisma.UserEditorBoardSelect;

const EDITOR_BOARD_SELECT = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EditorBoardSelect;

const PROJECT_SELECT = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

const APPLICATION_LIST_SELECT = {
  id: true,
  project: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
  title: true,
  type: true,
  status: true,
  folderImageUrl: true,
  verifiedByUser: USER_SELECT,
  createdByUser: USER_SELECT,
  updatedByUser: USER_SELECT,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ApplicationSelect;

@Injectable()
export class EditorBoardsService {
  private readonly logger = new Logger(EditorBoardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
  ) {}

  @InvalidateCache((args) => [`board:list:*`])
  async createEditorBoard(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    userId: number;
  }) {
    try {
      const board = await this.prisma.$transaction(async (prisma) => {
        const newBoard = await prisma.editorBoard.create({
          data: {
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl,
            createdBy: data.userId,
            updatedBy: data.userId,
          },
          select: EDITOR_BOARD_SELECT,
        });

        await prisma.userEditorBoard.create({
          data: {
            userId: data.userId,
            editorBoardId: newBoard.id,
            isLead: true,
          },
        });

        return newBoard;
      });
      return board;
    } catch (error) {
      this.handleError(error, 'Create editor board fail', ERROR.SVCREBOARD);
    }
  }

  @UseCache((args) => `board:list:${args[0]}`)
  async getEditorBoards(
    userId: number,
    filter?: FilterBoards,
    sort?: OrderBoards,
    pagination?: Pagination,
  ) {
    try {
      const where: Prisma.EditorBoardWhereInput = {
        ...(filter?.name && { name: { contains: filter.name, mode: 'insensitive' } }),
        ...(filter?.me
          ? { createdBy: userId }
          : { OR: [{ createdBy: userId }, { userEditorBoards: { some: { userId } } }] }),
      };
      const field = sort?.field || 'createdAt';
      const order = sort?.order || 'desc';
      const orderBy: Prisma.EditorBoardOrderByWithRelationInput = { [field]: order };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, boards] = await this.prisma.$transaction([
        this.prisma.editorBoard.count({ where }),
        this.prisma.editorBoard.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            ...EDITOR_BOARD_SELECT,
            _count: {
              select: {
                projects: true,
              },
            },
          },
        }),
      ]);

      const boardsWithProjectCount = boards.map((board) => ({
        ...board,
        numberOfProjects: board._count.projects,
        _count: undefined,
      }));

      return {
        boards: boardsWithProjectCount,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get editor boards fail', ERROR.SVGETBOARDS);
    }
  }

  @UseCache((args) => `board:${args[0]}`)
  async getBoardById(id: number) {
    try {
      const board = await this.prisma.editorBoard.findUnique({
        where: { id },
        select: EDITOR_BOARD_SELECT,
      });
      if (!board) {
        throw new NotFoundException(ERROR.NFBOARD);
      }
      return board;
    } catch (error) {
      this.handleError(error, 'Get editor board fail', ERROR.SVGETBOARD);
    }
  }

  @InvalidateCache((args) => [`board:${args[0]}`, `board:list:*`])
  async deleteBoard(id: number) {
    try {
      await this.ensureBoard(id);
      await this.prisma.$transaction([
        this.prisma.project.updateMany({
          where: { editorBoardId: id },
          data: { editorBoardId: null },
        }),
        this.prisma.editorBoard.delete({
          where: { id },
        }),
      ]);
    } catch (error) {
      this.handleError(error, 'Delete editor board fail', ERROR.SVDELETEBOARD);
    }
  }

  @InvalidateCache((args) => [`board:${args[0]}`, `board:list:*`])
  async updateBoard(
    id: number,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string;
      userId: number;
    },
  ) {
    try {
      await this.ensureBoard(id);
      const board = await this.prisma.editorBoard.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          updatedBy: data.userId,
        },
        select: EDITOR_BOARD_SELECT,
      });
      return board;
    } catch (error) {
      this.handleError(error, 'Update editor board fail', ERROR.SVUPDATEBOARD);
    }
  }

  @InvalidateCache((args) => [
    `board:${args[0]}:members:*`,
    ...args[1].map((userId: number) => `user:${userId}:editor-boards`),
    ...args[1].map((userId: number) => `board:list:${userId}:*`),
  ])
  async addMembersToBoard(editorBoardId: number, userIds: number[], actorId: number) {
    try {
      await this.ensureBoard(editorBoardId);

      const uniqueUserIds = this.uniqueIds(userIds);
      const existingUsers = await this.prisma.user.count({
        where: { id: { in: uniqueUserIds } },
      });
      if (existingUsers !== uniqueUserIds.length) {
        throw new NotFoundException(ERROR.NFUSER);
      }

      await this.prisma.userEditorBoard.createMany({
        data: uniqueUserIds.map((userId) => ({
          userId,
          editorBoardId,
        })),
        skipDuplicates: true,
      });

      this.eventEmitter.emit(ACTIVITY_EVENT_NAME, {
        action: ACTIVITY_ACTION.MEMBER_INVITED,
        entityType: ENTITY_TYPE.EDITOR_BOARD,
        entityId: editorBoardId,
        editorBoardId,
        actorId,
        metadata: {
          invitedUserIds: uniqueUserIds,
        },
      } satisfies ActivityEventPayload);
    } catch (error) {
      this.handleError(error, 'Add member to editor board fail', ERROR.SVADDBOARDMEMBER);
    }
  }

  @UseCache((args) => `board:${args[0]}:members`)
  async getBoardMembers(
    editorBoardId: number,
    filter?: { search?: string },
    sort?: { field?: 'displayName' | 'email'; order?: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureBoard(editorBoardId);

      const where: Prisma.UserEditorBoardWhereInput = {
        editorBoardId,
        ...(filter?.search && {
          OR: [
            { user: { displayName: { contains: filter.search, mode: 'insensitive' } } },
            { user: { email: { contains: filter.search, mode: 'insensitive' } } },
          ],
        }),
      };
      const field = sort?.field || 'displayName';
      const order = sort?.order || 'asc';
      const orderBy: Prisma.UserEditorBoardOrderByWithRelationInput = {
        user: { [field]: order },
      };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, members] = await this.prisma.$transaction([
        this.prisma.userEditorBoard.count({ where }),
        this.prisma.userEditorBoard.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: BOARD_MEMBER_SELECT,
        }),
      ]);

      return {
        data: members.map((member) => ({ ...member.user, isLead: member.isLead })),
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get board members fail', ERROR.SVGETBOARDMEMBERS);
    }
  }

  @UseCache((args) => `board:${args[0]}:members:${args[1]}`)
  async getBoardMember(editorBoardId: number, userId: number) {
    try {
      const member = await this.findBoardMember(editorBoardId, userId);
      return { ...member.user, isLead: member.isLead };
    } catch (error) {
      this.handleError(error, 'Get board member fail', ERROR.SVGETBOARDMEMBER);
    }
  }

  @InvalidateCache((args) => [
    `board:${args[0]}:members:*`,
    `user:${args[1]}:editor-boards`,
    `board:list:${args[1]}:*`,
  ])
  async removeBoardMember(editorBoardId: number, userId: number, actorId: number) {
    try {
      await this.ensureBoard(editorBoardId);

      const owner = await this.prisma.editorBoard.count({
        where: {
          id: editorBoardId,
          createdBy: userId,
        },
      });
      if (owner > 0) {
        throw new BadRequestException(ERROR.EVLRMOWNER);
      }

      await this.findBoardMember(editorBoardId, userId);
      await this.prisma.userEditorBoard.delete({
        where: {
          userId_editorBoardId: {
            editorBoardId,
            userId,
          },
        },
      });

      this.eventEmitter.emit(ACTIVITY_EVENT_NAME, {
        action: ACTIVITY_ACTION.MEMBER_REMOVED,
        entityType: ENTITY_TYPE.EDITOR_BOARD,
        entityId: editorBoardId,
        editorBoardId,
        actorId,
        metadata: {
          removedUserId: userId,
        },
      } satisfies ActivityEventPayload);
    } catch (error) {
      this.handleError(error, 'Remove board member fail', ERROR.SVREMOVEBOARDMEMBER);
    }
  }

  @InvalidateCache((args) => [
    `board:${args[0]}:members:*`,
    `user:${args[1]}:editor-boards`,
    `board:list:${args[1]}:*`,
  ])
  async leaveBoard(editorBoardId: number, userId: number) {
    try {
      const board = await this.ensureBoard(editorBoardId);
      if (board.createdBy === userId) {
        throw new BadRequestException(ERROR.EVLRMOWNER);
      }

      await this.findBoardMember(editorBoardId, userId);
      await this.prisma.userEditorBoard.delete({
        where: {
          userId_editorBoardId: {
            editorBoardId,
            userId,
          },
        },
      });
    } catch (error) {
      this.handleError(error, 'Leave board fail', ERROR.SVLEAVEBOARD);
    }
  }

  @InvalidateCache((args) => [
    `board:${args[0]}:members:*`,
    `user:${args[1]}:editor-boards`,
    `board:list:${args[1]}:*`,
  ])
  async setToLead(editorBoardId: number, userId: number) {
    try {
      await this.findBoardMember(editorBoardId, userId);

      const updatedMember = await this.prisma.$transaction(async (prisma) => {
        await prisma.userEditorBoard.updateMany({
          where: { editorBoardId },
          data: { isLead: false },
        });
        const member = await prisma.userEditorBoard.update({
          where: {
            userId_editorBoardId: {
              editorBoardId,
              userId,
            },
          },
          data: {
            isLead: true,
          },
          select: BOARD_MEMBER_SELECT,
        });
        return { ...member.user, isLead: member.isLead };
      });
      return updatedMember;
    } catch (error) {
      this.handleError(error, 'Update board member fail', ERROR.SVUPDBOARDMEMBER);
    }
  }

  @UseCache((args) => `board:${args[0]}:projects`)
  async getBoardProjects(
    editorBoardId: number,
    filter?: { search?: string },
    order?: { field: 'name' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureBoard(editorBoardId);

      const where: Prisma.ProjectWhereInput = {
        editorBoardId,
        ...(filter?.search && {
          name: { contains: filter.search, mode: 'insensitive' },
        }),
      };
      const orderBy: Prisma.ProjectOrderByWithRelationInput | undefined = order
        ? { [order.field]: order.order }
        : undefined;
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, projects] = await this.prisma.$transaction([
        this.prisma.project.count({ where }),
        this.prisma.project.findMany({
          where,
          orderBy,
          take: limit,
          skip,
          select: PROJECT_SELECT,
        }),
      ]);

      return { projects, pagination: this.buildPaginationMeta(total, page, limit) };
    } catch (error) {
      this.handleError(error, 'Get board projects fail', ERROR.SVGETBOARDPROJECTS);
    }
  }

  @InvalidateCache((args) => [`board:${args[0]}:projects:*`])
  async addProjectsToBoard(editorBoardId: number, projectIds: number[]) {
    try {
      await this.ensureBoard(editorBoardId);

      const uniqueProjectIds = this.uniqueIds(projectIds);
      const projects = await this.prisma.$transaction(async (prisma) => {
        const board = await prisma.editorBoard.findUnique({
          where: { id: editorBoardId },
          select: { createdBy: true },
        });

        const existingProjects = await prisma.project.findMany({
          where: { id: { in: uniqueProjectIds } },
          select: { id: true, createdBy: true },
        });

        if (existingProjects.length !== uniqueProjectIds.length) {
          throw new NotFoundException(ERROR.NFPROJECT);
        }

        const invalidCreatorProjects = existingProjects.filter(
          (p) => p.createdBy !== board?.createdBy,
        );
        if (invalidCreatorProjects.length > 0) {
          throw new ForbiddenException(
            'All projects must be created by the same creator as the editor board',
          );
        }

        const cflProjects = await prisma.project.count({
          where: {
            id: { in: uniqueProjectIds },
            editorBoardId: { not: null },
            NOT: { editorBoardId },
          },
        });
        if (cflProjects > 0) {
          throw new ConflictException(ERROR.CFLBOARDPROJECTS);
        }

        return prisma.project.updateMany({
          where: { id: { in: uniqueProjectIds } },
          data: { editorBoardId },
        });
      });
      return projects;
    } catch (error) {
      this.handleError(error, 'Add projects to board fail', ERROR.SVADDBOARDPROJECTS);
    }
  }

  @UseCache((args) => `board:${args[0]}:applications`)
  async getBoardApplications(
    editorBoardId: number,
    filter?: { search?: string },
    order?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureBoard(editorBoardId);

      const where: Prisma.ApplicationWhereInput = {
        project: { editorBoardId },
        type: { in: [APPLICATION_TYPE.CREATE_ARC, APPLICATION_TYPE.CREATE_CHAPTER] },
        status: {
          in: [APPLICATION_STATUS.SUBMITTED, APPLICATION_STATUS.APPROVE, APPLICATION_STATUS.REJECT],
        },
        ...(filter?.search && {
          title: { contains: filter.search, mode: 'insensitive' },
        }),
      };
      const orderBy: Prisma.ApplicationOrderByWithRelationInput | undefined = order
        ? { [order.field]: order.order }
        : undefined;
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, applications] = await this.prisma.$transaction([
        this.prisma.application.count({ where }),
        this.prisma.application.findMany({
          where,
          orderBy,
          take: limit,
          skip,
          select: APPLICATION_LIST_SELECT,
        }),
      ]);

      return { applications, pagination: this.buildPaginationMeta(total, page, limit) };
    } catch (error) {
      this.handleError(error, 'Get board applications fail', ERROR.SVGETBOARDAPPLICATIONS);
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

  private async ensureBoard(id: number) {
    const board = await this.prisma.editorBoard.findUnique({
      where: { id },
    });
    if (!board) {
      throw new NotFoundException(ERROR.NFBOARD);
    }
    return board;
  }

  private async findBoardMember(editorBoardId: number, userId: number) {
    await this.ensureBoard(editorBoardId);

    const member = await this.prisma.userEditorBoard.findUnique({
      where: {
        userId_editorBoardId: {
          editorBoardId,
          userId,
        },
      },
      select: BOARD_MEMBER_SELECT,
    });
    if (!member) {
      throw new NotFoundException(ERROR.NFUSER);
    }
    return member;
  }

  private uniqueIds(ids: number[]) {
    return [...new Set(ids)];
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
