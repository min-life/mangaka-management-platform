import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { APPLICATION_STATUS, APPLICATION_TYPE, Prisma, SCOPE } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import type { Pagination } from '../share/interfaces';

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

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createProject(data: { name: string; editorBoardId?: number | null; userId: number }) {
    try {
      const project = await this.prisma.$transaction(async (prisma) => {
        if (data.editorBoardId) {
          await this.ensureBoard(data.editorBoardId, prisma);
        }

        const defaultRole = await this.ensureDefaultProjectRole(prisma);
        const newProject = await prisma.project.create({
          data: {
            name: data.name,
            editorBoardId: data.editorBoardId,
            createdBy: data.userId,
            updatedBy: data.userId,
          },
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

  async getProjectById(id: number) {
    try {
      return await this.ensureProject(id);
    } catch (error) {
      this.handleError(error, 'Get project fail', ERROR.SVGETPROJECT);
    }
  }

  async updateProject(
    id: number,
    data: { name?: string; editorBoardId?: number | null; userId: number },
  ) {
    try {
      await this.ensureProject(id);
      if (data.editorBoardId) {
        await this.ensureBoard(data.editorBoardId);
      }

      return await this.prisma.project.update({
        where: { id },
        data: {
          name: data.name,
          editorBoardId: data.editorBoardId,
          updatedBy: data.userId,
        },
      });
    } catch (error) {
      this.handleError(error, 'Update project fail', ERROR.SVUPDATEPROJECT);
    }
  }

  async deleteProject(id: number) {
    try {
      await this.ensureProject(id);
      await this.prisma.project.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, 'Delete project fail', ERROR.SVDELETEPROJECT);
    }
  }

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
    } catch (error) {
      this.handleError(error, 'Add project member fail', ERROR.SVADDPROJECTMEMBER);
    }
  }

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
          select: PROJECT_MEMBER_SELECT,
        }),
      ]);

      return {
        data: members.map((member) => ({
          ...member.user,
          role: member.role,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        })),
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get project members fail', ERROR.SVGETPROJECTMEMBERS);
    }
  }

  async getProjectMember(projectId: number, userId: number) {
    try {
      const member = await this.findProjectMember(projectId, userId);
      return {
        ...member.user,
        role: member.role,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      };
    } catch (error) {
      this.handleError(error, 'Get project member fail', ERROR.SVGETPROJECTMEMBER);
    }
  }

  async updateProjectMember(projectId: number, userId: number, roleId: number, actorId: number) {
    try {
      await this.findProjectMember(projectId, userId);
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
          },
        });
        return prisma.userProject.findFirstOrThrow({
          where: { projectId, userId },
          select: PROJECT_MEMBER_SELECT,
        });
      });

      return {
        ...updatedMember.user,
        role: updatedMember.role,
        createdAt: updatedMember.createdAt,
        updatedAt: updatedMember.updatedAt,
      };
    } catch (error) {
      this.handleError(error, 'Update project member fail', ERROR.SVUPDATEPROJECTMEMBER);
    }
  }

  async removeProjectMember(projectId: number, userId: number) {
    try {
      const project = await this.ensureProject(projectId);
      if (project.createdBy === userId) {
        throw new BadRequestException(ERROR.EVLRMPRJOWNER);
      }

      await this.findProjectMember(projectId, userId);
      await this.prisma.userProject.deleteMany({ where: { projectId, userId } });
    } catch (error) {
      this.handleError(error, 'Remove project member fail', ERROR.SVREMOVEPROJECTMEMBER);
    }
  }

  async getProjectEditorBoard(projectId: number) {
    try {
      await this.ensureProject(projectId);
      return await this.prisma.editorBoard.findFirst({
        where: { projects: { some: { id: projectId } } },
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

  async createProjectApplication(
    projectId: number,
    data: {
      title: string;
      description?: string;
      materials: unknown;
      type: APPLICATION_TYPE;
      userId: number;
    },
  ) {
    try {
      await this.ensureProject(projectId);
      return await this.prisma.application.create({
        data: {
          projectId,
          title: data.title,
          description: data.description,
          materials: data.materials as Prisma.InputJsonValue,
          type: data.type,
          createdBy: data.userId,
          updatedBy: data.userId,
        },
      });
    } catch (error) {
      this.handleError(error, 'Create project application fail', ERROR.SVCREPROJECTAPPLICATION);
    }
  }

  async getProjectFolders(
    projectId: number,
    filter?: { search?: string; parentId?: number },
    order?: { field: 'title' | 'createdAt'; order: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      await this.ensureProject(projectId);

      const where: Prisma.FolderWhereInput = {
        projectId,
        ...(filter?.search && { title: { contains: filter.search, mode: 'insensitive' } }),
        ...(filter?.parentId && { parentId: filter.parentId }),
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

  async createProjectFolder(
    projectId: number,
    data: {
      title: string;
      description?: string;
      parentId?: number;
      userId: number;
    },
  ) {
    try {
      await this.ensureProject(projectId);
      if (data.parentId) {
        await this.ensureProjectFolder(projectId, data.parentId);
      }

      return await this.prisma.folder.create({
        data: {
          projectId,
          title: data.title,
          description: data.description,
          parentId: data.parentId,
          createdBy: data.userId,
          updatedBy: data.userId,
        },
      });
    } catch (error) {
      this.handleError(error, 'Create project folder fail', ERROR.SVCREPROJECTFOLDER);
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
      select: PROJECT_MEMBER_SELECT,
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

  async getProjectStats(projectId: number) {
    try {
      await this.ensureProject(projectId);

      const projectStat = await this.prisma.projectStat.findFirst({
        where: { projectId },
      });

      return projectStat;
    } catch (error) {
      this.handleError(error, 'Get project stats fail', ERROR.SVGETPROJECTSTATSBYPROJECT);
    }
  }

  async importProjectStats(projectId: number, data: { metrics: unknown }) {
    try {
      await this.ensureProject(projectId);

      const existingStat = await this.prisma.projectStat.findFirst({
        where: { projectId },
      });

      if (existingStat) {
        return await this.prisma.projectStat.update({
          where: { id: existingStat.id },
          data: {
            metrics: data.metrics as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
        });
      }

      return await this.prisma.projectStat.create({
        data: {
          projectId,
          metrics: data.metrics as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.handleError(error, 'Import project stats fail', ERROR.SVIMPORTPROJECTSTATS);
    }
  }
}
