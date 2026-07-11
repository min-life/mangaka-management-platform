import {
  BadRequestException,
  HttpException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ACTIVITY_ACTION,
  APPLICATION_STATUS,
  APPLICATION_TYPE,
  ENTITY_TYPE,
  Prisma,
  PROGRESS_STATUS,
  SCOPE,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACTIVITY_EVENT_NAME, ActivityEventPayload } from '../share/events/activity.event';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import type { Pagination } from '../share/interfaces';
import { AwsS3Service } from '../share/services/aws-s3.service';
import { randomUUID } from 'crypto';
import sizeOf from 'image-size';
import { CacheService } from '../redis/cache.service';
import { UseCache, InvalidateCache } from '../share/decorators/cache.decorator';
import { parse } from 'csv-parse/sync';
const PROJECT_MEMBER_SELECT = {
  user: {
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  role: {
    select: {
      id: true,
      code: true,
      name: true,
      scope: true,
      isDefault: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserProjectSelect;

const buildProjectMemberSelect = (projectId: number) =>
  ({
    ...PROJECT_MEMBER_SELECT,
    user: {
      select: {
        ...PROJECT_MEMBER_SELECT.user.select,
        _count: {
          select: {
            assignedTasks: {
              where: {
                file: {
                  folder: {
                    projectId,
                  },
                },
              },
            },
          },
        },
      },
    },
  }) satisfies Prisma.UserProjectSelect;

const EDITOR_BOARD_SELECT = {
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
} satisfies Prisma.EditorBoardSelect;

const EDITOR_BOARD_BASIC_SELECT = {
  id: true,
  name: true,
  imageUrl: true,
} satisfies Prisma.EditorBoardSelect;

const PROJECT_SELECT = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  editorBoard: {
    select: EDITOR_BOARD_BASIC_SELECT,
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

const PROJECT_WITH_MEMBERS_SELECT = {
  ...PROJECT_SELECT,
  userProjects: {
    select: PROJECT_MEMBER_SELECT,
  },
} satisfies Prisma.ProjectSelect;

const APPLICATION_LIST_SELECT = {
  id: true,
  title: true,
  type: true,
  status: true,
  parentFolderId: true,
  folderImageUrl: true,
  project: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
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

const FOLDER_LIST_SELECT = {
  id: true,
  title: true,
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
} satisfies Prisma.FolderSelect;

const PROJECT_STAT_SELECT = {
  id: true,
  project: {
    select: PROJECT_SELECT,
  },
  year: true,
  month: true,
  views: true,
  sales: true,
  revenue: true,
  reviews: true,
  rating: true,
  updatedAt: true,
} satisfies Prisma.ProjectStatSelect;

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly awsS3Service: AwsS3Service,
    private readonly cacheService: CacheService,
  ) {}

  @InvalidateCache((args) => [`project:list:${args[0].userId}:*`])
  async createProject(data: {
    name: string;
    editorBoardId?: number | null;
    userId: number;
    description?: string;
    imageUrl?: string;
  }) {
    try {
      const project = await this.prisma.$transaction(async (prisma) => {
        if (data.editorBoardId) {
          const board = await this.ensureBoard(data.editorBoardId, prisma);
          if (board.createdBy !== data.userId) {
            throw new ForbiddenException(
              'Project must be created by the same creator as the editor board',
            );
          }
        }

        const defaultRole = await this.ensureDefaultProjectRole(prisma);
        const newProject = await prisma.project.create({
          data: {
            name: data.name,
            editorBoardId: data.editorBoardId,
            createdBy: data.userId,
            updatedBy: data.userId,
            description: data.description,
            imageUrl: data.imageUrl,
          },
          select: PROJECT_SELECT,
        });

        await prisma.userProject.create({
          data: {
            userId: data.userId,
            projectId: newProject.id,
            roleId: defaultRole.id,
            createdBy: data.userId,
            updatedBy: data.userId,
          },
        });

        return newProject;
      });
      return project;
    } catch (error) {
      this.handleError(error, 'Create project fail', ERROR.SVCREPROJECT);
    }
  }

  @UseCache((args) => `project:list:${args[0]}`)
  async getProjects(
    userId: number,
    filter?: { name?: string; me?: boolean },
    sort?: { field: 'createdAt' | 'updatedAt' | 'name'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      const where: Prisma.ProjectWhereInput = {
        ...(filter?.name && { name: { contains: filter.name, mode: 'insensitive' } }),
        ...(filter?.me
          ? { createdBy: userId }
          : { OR: [{ createdBy: userId }, { userProjects: { some: { userId } } }] }),
      };
      const field = sort?.field || 'createdAt';
      const order = sort?.order || 'desc';
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, projects] = await this.prisma.$transaction([
        this.prisma.project.count({ where }),
        this.prisma.project.findMany({
          where,
          orderBy: { [field]: order },
          skip,
          take: limit,
          select: PROJECT_SELECT,
        }),
      ]);

      return {
        projects,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get projects fail', ERROR.SVGETPROJECTS);
    }
  }

  @UseCache((args) => `project:${args[0]}`)
  async getProjectById(id: number) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        select: PROJECT_SELECT,
      });
      if (!project) {
        throw new NotFoundException(ERROR.NFPROJECT);
      }
      return project;
    } catch (error) {
      this.handleError(error, 'Get project fail', ERROR.SVGETPROJECT);
    }
  }

  async getProjectDashboard(projectId: number, userId: number) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) throw new NotFoundException(ERROR.NFPROJECT);

      const [
        totalMembers,
        totalFolders,
        totalFiles,
        totalTasks,
        progressStatsRaw,
        activeTasks,
        overdueTasks,
        dueSoonTasks,
        pendingApplications,
        recentFilesRaw
      ] = await Promise.all([
        this.prisma.userProject.count({ where: { projectId } }),
        this.prisma.folder.count({ where: { projectId } }),
        this.prisma.file.count({ where: { folder: { projectId } } }),
        this.prisma.task.count({ where: { file: { folder: { projectId } } } }),
        this.prisma.task.groupBy({
          by: ['status'],
          _count: true,
          where: { file: { folder: { projectId } } },
        }),
        this.prisma.task.findMany({
          where: { file: { folder: { projectId } }, assignedBy: userId, status: { not: 'DONE' } },
          select: { id: true, title: true, status: true, deadline: true, fileId: true },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.task.findMany({
          where: { file: { folder: { projectId } }, deadline: { lt: new Date() }, status: { not: 'DONE' } },
          select: { id: true, title: true, status: true, deadline: true, fileId: true },
          take: 5,
          orderBy: { deadline: 'asc' }
        }),
        this.prisma.task.findMany({
          where: { file: { folder: { projectId } }, deadline: { gte: new Date(), lte: new Date(Date.now() + 24 * 60 * 60 * 1000) }, status: { not: 'DONE' } },
          select: { id: true, title: true, status: true, deadline: true, fileId: true },
          take: 5,
          orderBy: { deadline: 'asc' }
        }),
        this.prisma.application.findMany({
          where: { projectId, status: { in: ['PENDING', 'SUBMITTED'] } },
          select: { id: true, title: true, status: true },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.file.findMany({
          where: { folder: { projectId } },
          select: {
            id: true,
            title: true,
            updatedAt: true,
            folder: { select: { id: true, title: true } },
            fileMaterials: {
              where: { taskId: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { materials: true }
            }
          },
          take: 4,
          orderBy: { updatedAt: 'desc' }
        })
      ]);

      const progressStats = {
        completedTasks: progressStatsRaw.find((p) => p.status === 'DONE')?._count || 0,
        pendingTasks: progressStatsRaw.find((p) => p.status === 'PENDING')?._count || 0,
        inProgressTasks: progressStatsRaw.find((p) => p.status === 'INPROGRESS')?._count || 0,
        reviewTasks: progressStatsRaw.find((p) => p.status === 'REVIEW')?._count || 0,
      };

      const recentFiles = recentFilesRaw.map(file => {
        let imageUrl: string | null = null;
        if (file.fileMaterials && file.fileMaterials.length > 0) {
          const materialsArray = file.fileMaterials[0].materials as any[];
          if (Array.isArray(materialsArray) && materialsArray.length > 0) {
            imageUrl = materialsArray[0]?.url || null;
          }
        }
        return {
          id: file.id,
          title: file.title,
          updatedAt: file.updatedAt,
          folder: file.folder,
          imageUrl
        };
      });

      return {
        overview: {
          totalMembers,
          totalFolders,
          totalFiles,
          totalTasks,
        },
        progressStats,
        myWorkspace: {
          activeTasks,
        },
        actionNeeded: {
          overdueTasks,
          dueSoonTasks,
          pendingApplications,
        },
        recentFiles,
      };
    } catch (error) {
      this.handleError(error, 'Get project dashboard fail', 'SVGETPROJECT');
    }
  }

  @InvalidateCache((args) => [`project:${args[0]}`, `project:list:*`])
  async updateProject(
    id: number,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string;
      editorBoardId?: number | null;
      userId: number;
    },
  ) {
    try {
      const project = await this.ensureProject(id);
      if (data.editorBoardId) {
        const board = await this.ensureBoard(data.editorBoardId);
        if (board.createdBy !== project.createdBy) {
          throw new ForbiddenException(
            'Project must be created by the same creator as the editor board',
          );
        }
      }

      return await this.prisma.project.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          editorBoardId: data.editorBoardId,
          updatedBy: data.userId,
        },
        select: PROJECT_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Update project fail', ERROR.SVUPDATEPROJECT);
    }
  }

  @InvalidateCache((args) => [`project:${args[0]}`, `project:list:*`])
  async deleteProject(id: number) {
    try {
      await this.ensureProject(id);
      await this.prisma.project.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete project fail', ERROR.SVDELETEPROJECT);
    }
  }

  @InvalidateCache((args) => [
    `project:${args[0]}:members:*`,
    ...args[1].map((userId: number) => `user:${userId}:projects`),
    ...args[1].map((userId: number) => `project:list:${userId}:*`),
  ])
  async addMembersToProject(projectId: number, userIds: number[], roleId: number, actorId: number) {
    try {
      await this.ensureProject(projectId);
      await this.ensureProjectRole(roleId);

      const uniqueUserIds = this.uniqueIds(userIds);
      const existingUsers = await this.prisma.user.count({
        where: { id: { in: uniqueUserIds } },
      });
      if (existingUsers !== uniqueUserIds.length) {
        throw new NotFoundException(ERROR.NFUSER);
      }

      await this.prisma.$transaction(async (prisma) => {
        await prisma.userProject.deleteMany({
          where: {
            projectId,
            userId: { in: uniqueUserIds },
          },
        });
        await prisma.userProject.createMany({
          data: uniqueUserIds.map((userId) => ({
            userId,
            projectId,
            roleId,
            createdBy: actorId,
            updatedBy: actorId,
          })),
        });
      });

      this.eventEmitter.emit(ACTIVITY_EVENT_NAME, {
        action: ACTIVITY_ACTION.MEMBER_INVITED,
        entityType: ENTITY_TYPE.PROJECT,
        entityId: projectId,
        projectId: projectId,
        actorId,
        metadata: {
          invitedUserIds: uniqueUserIds,
        },
      } as ActivityEventPayload);
    } catch (error) {
      this.handleError(error, 'Add project member fail', ERROR.SVADDPROJECTMEMBER);
    }
  }

  @UseCache((args) => `project:${args[0]}:members`)
  async getProjectMembers(
    projectId: number,
    filter?: { search?: string },
    sort?: { field?: 'displayName' | 'email' | 'createdAt'; order?: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureProject(projectId);

      const where: Prisma.UserProjectWhereInput = {
        projectId,
        ...(filter?.search && {
          OR: [
            { user: { displayName: { contains: filter.search, mode: 'insensitive' } } },
            { user: { email: { contains: filter.search, mode: 'insensitive' } } },
          ],
        }),
      };
      const field = sort?.field || 'displayName';
      const order = sort?.order || 'asc';
      const orderBy: Prisma.UserProjectOrderByWithRelationInput =
        field === 'createdAt' ? { createdAt: order } : { user: { [field]: order } };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, members] = await this.prisma.$transaction([
        this.prisma.userProject.count({ where }),
        this.prisma.userProject.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: buildProjectMemberSelect(projectId),
        }),
      ]);

      return {
        data: members.map((member) => {
          const { _count, ...userWithoutCount } = member.user as any;
          return {
            ...userWithoutCount,
            numberOfTasks: _count?.assignedTasks || 0,
            role: member.role,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
          };
        }),
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get project members fail', ERROR.SVGETPROJECTMEMBERS);
    }
  }

  @UseCache((args) => `project:${args[0]}:members:${args[1]}`)
  async getProjectMember(projectId: number, userId: number) {
    try {
      const member = await this.findProjectMember(projectId, userId);
      const { _count, ...userWithoutCount } = member.user as any;
      const taskGroupBy = await this.prisma.task.groupBy({
        by: ['status'],
        where: {
          assignedBy: userId,
          file: { folder: { projectId } },
        },
        _count: { id: true },
      });

      const taskOverview = { total: 0, pending: 0, inprogress: 0, review: 0, done: 0 };
      taskGroupBy.forEach((group) => {
        const count = group._count.id;
        taskOverview.total += count;
        if (group.status === PROGRESS_STATUS.PENDING) taskOverview.pending = count;
        else if (group.status === PROGRESS_STATUS.INPROGRESS) taskOverview.inprogress = count;
        else if (group.status === PROGRESS_STATUS.REVIEW) taskOverview.review = count;
        else if (group.status === PROGRESS_STATUS.DONE) taskOverview.done = count;
      });

      return {
        ...userWithoutCount,
        numberOfTasks: _count?.assignedTasks || 0,
        taskOverview,
        role: member.role,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      };
    } catch (error) {
      this.handleError(error, 'Get project member fail', ERROR.SVGETPROJECTMEMBER);
    }
  }

  @InvalidateCache((args) => [
    `project:${args[0]}:members:*`,
    `user:${args[1]}:projects`,
    `project:list:${args[1]}:*`,
  ])
  async updateProjectMember(projectId: number, userId: number, roleId: number, actorId: number) {
    try {
      const existingMember = await this.findProjectMember(projectId, userId);
      await this.ensureProjectRole(roleId);

      const updatedMember = await this.prisma.$transaction(async (prisma) => {
        await prisma.userProject.deleteMany({ where: { projectId, userId } });
        await prisma.userProject.create({
          data: {
            projectId,
            userId,
            roleId,
            createdBy: actorId,
            updatedBy: actorId,
            createdAt: existingMember.createdAt,
          },
        });
        return prisma.userProject.findFirstOrThrow({
          where: { projectId, userId },
          select: buildProjectMemberSelect(projectId),
        });
      });

      const { _count, ...userWithoutCount } = updatedMember.user as any;
      return {
        ...userWithoutCount,
        numberOfTasks: _count?.assignedTasks || 0,
        role: updatedMember.role,
        createdAt: updatedMember.createdAt,
        updatedAt: updatedMember.updatedAt,
      };
    } catch (error) {
      this.handleError(error, 'Update project member fail', ERROR.SVUPDATEPROJECTMEMBER);
    }
  }

  @InvalidateCache((args) => [
    `project:${args[0]}:members:*`,
    `user:${args[1]}:projects`,
    `project:list:${args[1]}:*`,
  ])
  async removeProjectMember(projectId: number, userId: number, actorId: number) {
    try {
      const project = await this.ensureProject(projectId);
      if (project.createdBy === userId) {
        throw new BadRequestException(ERROR.EVLRMPRJOWNER);
      }

      await this.findProjectMember(projectId, userId);
      await this.prisma.userProject.deleteMany({ where: { projectId, userId } });

      this.eventEmitter.emit(ACTIVITY_EVENT_NAME, {
        action: ACTIVITY_ACTION.MEMBER_REMOVED,
        entityType: ENTITY_TYPE.PROJECT,
        entityId: projectId,
        projectId: projectId,
        actorId,
        metadata: {
          removedUserId: userId,
        },
      } satisfies ActivityEventPayload);
    } catch (error) {
      this.handleError(error, 'Remove project member fail', ERROR.SVREMOVEPROJECTMEMBER);
    }
  }

  @InvalidateCache((args) => [
    `project:${args[0]}:members:*`,
    `user:${args[1]}:projects`,
    `project:list:${args[1]}:*`,
  ])
  async leaveProject(projectId: number, userId: number) {
    try {
      const project = await this.ensureProject(projectId);
      if (project.createdBy === userId) {
        throw new BadRequestException(ERROR.EVLRMPRJOWNER);
      }

      await this.findProjectMember(projectId, userId);
      await this.prisma.userProject.deleteMany({ where: { projectId, userId } });
    } catch (error) {
      this.handleError(error, 'Leave project fail', ERROR.SVLEAVEPROJECT);
    }
  }

  @UseCache((args) => `project:${args[0]}:editor-board`)
  async getProjectEditorBoard(projectId: number) {
    try {
      await this.ensureProject(projectId);
      return await this.prisma.editorBoard.findFirst({
        where: { projects: { some: { id: projectId } } },
        select: EDITOR_BOARD_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Get project editor board fail', ERROR.SVGETPROJECTBOARD);
    }
  }

  async setProjectEditorBoard(projectId: number, editorBoardId: number, actorId: number) {
    try {
      await this.ensureProject(projectId);
      await this.ensureBoard(editorBoardId);

      return await this.prisma.project.update({
        where: { id: projectId },
        data: {
          editorBoardId,
          updatedBy: actorId,
        },
      });
    } catch (error) {
      this.handleError(error, 'Update project editor board fail', ERROR.SVUPDATEPROJECTBOARD);
    }
  }

  @InvalidateCache((args) => [`project:${args[0]}`])
  async removeProjectEditorBoard(projectId: number, actorId: number) {
    try {
      await this.ensureProject(projectId);

      return await this.prisma.project.update({
        where: { id: projectId },
        data: {
          editorBoardId: null,
          updatedBy: actorId,
        },
      });
    } catch (error) {
      this.handleError(error, 'Remove project editor board fail', ERROR.SVUPDATEPROJECTBOARD);
    }
  }

  @UseCache((args) => `project:${args[0]}:applications`)
  async getProjectApplications(
    projectId: number,
    filter?: { search?: string; type?: APPLICATION_TYPE; status?: APPLICATION_STATUS },
    order?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureProject(projectId);

      const where: Prisma.ApplicationWhereInput = {
        projectId,
        ...(filter?.search && { title: { contains: filter.search, mode: 'insensitive' } }),
        ...(filter?.type && { type: filter.type }),
        ...(filter?.status && { status: filter.status }),
      };
      const orderBy: Prisma.ApplicationOrderByWithRelationInput = order
        ? { [order.field]: order.order }
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
      this.handleError(error, 'Get project applications fail', ERROR.SVGETPROJECTAPPLICATIONS);
    }
  }

  @InvalidateCache((args) => [`project:${args[0]}:applications:*`])
  async createProjectApplication(
    projectId: number,
    data: {
      title: string;
      description?: string;
      materials?: unknown;
      folderImageUrl?: string;
      type: APPLICATION_TYPE;
      userId: number;
      parentFolderId?: number;
      files?: {
        image?: Express.Multer.File[];
        text?: Express.Multer.File[];
        source?: Express.Multer.File[];
      };
    },
  ) {
    try {
      const project = await this.ensureProject(projectId);

      if (data.type === APPLICATION_TYPE.CREATE_CHAPTER) {
        if (!data.parentFolderId) {
          throw new BadRequestException(
            'parentFolderId is required for CREATE_CHAPTER application',
          );
        }
        const parentFolder = await this.ensureProjectFolder(projectId, data.parentFolderId);
        if (parentFolder.parentId !== null) {
          throw new BadRequestException(
            'Cannot create a subfolder under a Chapter (maximum depth is 2)',
          );
        }
      }

      let applicationMaterials: any[] = Array.isArray(data.materials) ? data.materials : [];

      if (
        data.type === APPLICATION_TYPE.CREATE_ARC ||
        data.type === APPLICATION_TYPE.CREATE_CHAPTER
      ) {
        const hasImage = data.files?.image && data.files.image.length > 0;
        const hasText = data.files?.text && data.files.text.length > 0;

        if (!hasImage || !hasText) {
          throw new BadRequestException(
            'At least 1 image and 1 text file are required for CREATE_ARC and CREATE_CHAPTER applications',
          );
        }

        const allFiles = [
          ...(data.files?.image?.map((f) => ({ file: f, type: 'IMAGE' })) || []),
          ...(data.files?.text?.map((f) => ({ file: f, type: 'TEXT' })) || []),
          ...(data.files?.source?.map((f) => ({ file: f, type: 'SOURCE' })) || []),
        ];

        const uploadedMaterials = await Promise.all(
          allFiles.map(async ({ file, type }) => {
            const ext = file.originalname.split('.').pop();
            const key = `applications/${projectId}/${randomUUID()}.${ext}`;
            const url = await this.awsS3Service.uploadFile(file, key);

            const materialObj: any = {
              url,
              originalName: file.originalname,
              size: file.size,
              mimeType: file.mimetype,
              type,
            };

            if (type === 'IMAGE') {
              try {
                const dimensions = sizeOf(file.buffer);
                if (dimensions && dimensions.width && dimensions.height) {
                  materialObj.width = dimensions.width;
                  materialObj.height = dimensions.height;
                  materialObj.ratio = Number((dimensions.width / dimensions.height).toFixed(3));
                  materialObj.isThumbnail = true;
                }
              } catch (e) {
                // Ignore dimensions
              }
            }

            return materialObj;
          }),
        );

        applicationMaterials = [...applicationMaterials, ...uploadedMaterials];
      }

      const application = await this.prisma.application.create({
        data: {
          projectId,
          title: data.title,
          description: data.description,
          materials: applicationMaterials as Prisma.InputJsonValue,
          type: data.type,
          parentFolderId: data.parentFolderId ? Number(data.parentFolderId) : null,
          folderImageUrl: data.folderImageUrl,
          createdBy: data.userId,
          updatedBy: data.userId,
        },
        select: APPLICATION_LIST_SELECT,
      });

      this.eventEmitter.emit(ACTIVITY_EVENT_NAME, {
        action: ACTIVITY_ACTION.APPLICATION_CREATED,
        entityType: ENTITY_TYPE.APPLICATION,
        entityId: application.id,
        projectId,
        actorId: data.userId,
        metadata: {
          title: application.title,
          projectOwnerId: project.createdBy,
        },
      } satisfies ActivityEventPayload);

      return application;
    } catch (error) {
      this.handleError(error, 'Create project application fail', ERROR.SVCREPROJECTAPPLICATION);
    }
  }

  @UseCache((args) => `project:${args[0]}:folders`)
  async getProjectFolders(
    projectId: number,
    filter?: { search?: string; parentId?: number; type?: 'ARC' | 'CHAPTER' },
    order?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureProject(projectId);

      const where: Prisma.FolderWhereInput = {
        projectId,
        ...(filter?.search && { title: { contains: filter.search, mode: 'insensitive' } }),
        ...(filter?.parentId && { parentId: filter.parentId }),
        ...(filter?.type === 'ARC' && { parentId: null }),
        ...(filter?.type === 'CHAPTER' && { parentId: { not: null } }),
      };
      const orderBy: Prisma.FolderOrderByWithRelationInput = order
        ? { [order.field]: order.order }
        : { createdAt: 'desc' };
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, folders] = await this.prisma.$transaction([
        this.prisma.folder.count({ where }),
        this.prisma.folder.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: FOLDER_LIST_SELECT,
        }),
      ]);

      return {
        folders,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get project folders fail', ERROR.SVGETPROJECTFOLDERS);
    }
  }

  @InvalidateCache((args) => [`project:${args[0]}:folders:*`])
  async createProjectFolder(
    projectId: number,
    data: {
      title: string;
      description?: string;
      parentId?: number;
      userId: number;
      imageUrl?: string;
    },
  ) {
    try {
      await this.ensureProject(projectId);
      if (data.parentId) {
        const parentFolder = await this.ensureProjectFolder(projectId, data.parentId);
        if (parentFolder.parentId !== null) {
          throw new BadRequestException(
            'Cannot create a subfolder under a Chapter (maximum depth is 2)',
          );
        }
      }

      return await this.prisma.folder.create({
        data: {
          projectId,
          title: data.title,
          description: data.description,
          parentId: data.parentId,
          imageUrl: data.imageUrl,
          createdBy: data.userId,
          updatedBy: data.userId,
        },
        select: FOLDER_LIST_SELECT,
      });
    } catch (error) {
      this.handleError(error, 'Create project folder fail', ERROR.SVCREPROJECTFOLDER);
    }
  }

  @UseCache((args) => `project:${args[0]}:tasks:${args[1]}`)
  async getMyProjectTasks(
    projectId: number,
    userId: number,
    filter?: {
      search?: string;
      status?: PROGRESS_STATUS;
    },
    sort?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureProject(projectId);

      const where: Prisma.TaskWhereInput = {
        file: {
          folder: {
            projectId,
          },
        },
        assignedBy: userId,
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
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            parentId: true,
            fileId: true,
            file: {
              select: {
                id: true,
                title: true,
              },
            },
            assignedByUser: {
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
          },
        }),
      ]);

      return {
        tasks,
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get my project tasks fail', ERROR.SVGETTASK);
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

  private async ensureProject(id: number) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(ERROR.NFPROJECT);
    }
    return project;
  }

  private async ensureBoard(
    id: number,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const board = await prisma.editorBoard.findUnique({ where: { id } });
    if (!board) {
      throw new NotFoundException(ERROR.NFBOARD);
    }
    return board;
  }

  private async ensureProjectRole(id: number) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(ERROR.NFROLE);
    }
    if (role.scope !== SCOPE.PRJ) {
      throw new BadRequestException(ERROR.EVLPRJROLE);
    }
    return role;
  }

  private async ensureDefaultProjectRole(prisma: Prisma.TransactionClient | PrismaService) {
    const role = await prisma.role.findFirst({
      where: {
        scope: SCOPE.PRJ,
        isDefault: true,
      },
    });
    if (!role) {
      throw new NotFoundException(ERROR.NFDEFAULTPRJROLE);
    }
    return role;
  }

  private async findProjectMember(projectId: number, userId: number) {
    await this.ensureProject(projectId);

    const member = await this.prisma.userProject.findFirst({
      where: {
        projectId,
        userId,
      },
      select: buildProjectMemberSelect(projectId),
    });
    if (!member) {
      throw new NotFoundException(ERROR.NFUSER);
    }
    return member;
  }

  private async ensureProjectFolder(projectId: number, folderId: number) {
    const folder = await this.prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      throw new NotFoundException(ERROR.NFFOLDER);
    }
    if (folder.projectId !== projectId) {
      throw new BadRequestException(ERROR.EVLPRJFOLDER);
    }
    return folder;
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

  async getProjectStats(projectId: number, query: any) {
    try {
      await this.ensureProject(projectId);

      let targetYear = query.year;

      // Filter scope
      const whereClause: Prisma.ProjectStatWhereInput = { projectId };
      if (query.chapterId) {
        whereClause.folderId = query.chapterId;
      } else if (query.arcId) {
        // Find all chapters under this arc
        const arcChapters = await this.prisma.folder.findMany({
          where: { parentId: query.arcId, projectId },
          select: { id: true },
        });
        whereClause.folderId = { in: arcChapters.map((c) => c.id) };
      }

      // If no year provided, find the max year for the given scope
      if (!targetYear) {
        const maxYearStat = await this.prisma.projectStat.findFirst({
          where: whereClause,
          orderBy: { year: 'desc' },
          select: { year: true },
        });
        targetYear = maxYearStat ? maxYearStat.year : new Date().getFullYear();
      }

      whereClause.year = targetYear;

      const rawStats = await this.prisma.projectStat.findMany({
        where: whereClause,
      });

      // Aggregate data
      const monthMap = new Map<number, any>();
      for (let i = 1; i <= 12; i++) {
        monthMap.set(i, {
          month: i,
          views: 0,
          sales: 0,
          revenue: 0,
          reviews: 0,
          rating: 0,
          _totalRatingScore: 0,
        });
      }

      for (const row of rawStats) {
        const item = monthMap.get(row.month)!;
        item.views += row.views;
        item.sales += row.sales;
        item.revenue += row.revenue;
        item.reviews += row.reviews;
        item._totalRatingScore += row.rating * row.reviews;
      }

      const summary = {
        totalViews: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalReviews: 0,
        averageRating: 0,
        _totalRatingScore: 0,
      };

      const months: any[] = [];
      for (let i = 1; i <= 12; i++) {
        const item = monthMap.get(i)!;
        if (item.reviews > 0) {
          item.rating = item._totalRatingScore / item.reviews;
        } else {
          item.rating = 0;
        }
        item.rating = Math.round(item.rating * 100) / 100;

        summary.totalViews += item.views;
        summary.totalSales += item.sales;
        summary.totalRevenue += item.revenue;
        summary.totalReviews += item.reviews;
        summary._totalRatingScore += item._totalRatingScore;

        delete item._totalRatingScore;
        months.push(item);
      }

      if (summary.totalReviews > 0) {
        summary.averageRating =
          Math.round((summary._totalRatingScore / summary.totalReviews) * 100) / 100;
      } else {
        summary.averageRating = 0;
      }
      delete (summary as any)._totalRatingScore;

      return {
        year: targetYear,
        summary,
        months,
      };
    } catch (error) {
      this.handleError(error, 'Get project stats fail', ERROR.SVGETPROJECTSTATSBYPROJECT);
    }
  }

  async importProjectStats(projectId: number, data: any, file: any) {
    try {
      await this.ensureProject(projectId);

      if (!file) {
        throw new BadRequestException('CSV file is required');
      }

      const chapterFolder = await this.prisma.folder.findUnique({
        where: { id: data.chapterId },
      });

      if (
        !chapterFolder ||
        chapterFolder.projectId !== projectId ||
        chapterFolder.parentId === null
      ) {
        throw new BadRequestException('Invalid chapterId');
      }

      const records = parse(file.buffer, {
        columns: (header) => header.map((column: string) => column.trim().toLowerCase()),
        skip_empty_lines: true,
      });

      for (const rawRow of records) {
        const row = rawRow as any;
        const year = parseInt(row.year);
        const month = parseInt(row.month);

        if (isNaN(year) || isNaN(month)) continue;

        const views = parseInt(row['total views']) || 0;
        const sales = parseInt(row['total sales']) || 0;
        const revenue = parseFloat(row['total revenue']) || 0;
        const reviews = parseInt(row['total reviews']) || 0;
        const rating = parseFloat(row['average rating']) || 0;

        await this.prisma.projectStat.upsert({
          where: {
            folderId_year_month: {
              folderId: data.chapterId,
              year,
              month,
            },
          },
          update: {
            views,
            sales,
            revenue,
            reviews,
            rating,
            updatedAt: new Date(),
          },
          create: {
            projectId,
            folderId: data.chapterId,
            year,
            month,
            views,
            sales,
            revenue,
            reviews,
            rating,
          },
        });
      }

      return { success: true };
    } catch (error) {
      this.handleError(error, 'Import project stats fail', ERROR.SVIMPORTPROJECTSTATS);
    }
  }
}
