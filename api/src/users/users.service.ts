import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, SCOPE } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { requireEnv, requireNumberEnv } from '../share/helpers/env';
import { serializeRole } from '../share/utils/role-serializer';
import { Resource, Permission, GoogleUser } from '../auth/interfaces';
import { Pagination } from '../share/interfaces';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_SALT_ROUNDS = requireNumberEnv('BCRYPT_SALT_ROUNDS');
const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');
const AVATAR_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

type AvatarUploadFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

const ACTIVITY_LIMIT = 3;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async findAll(
    filter?: { search?: string; isActive?: boolean },
    sort?: { field?: 'createdAt' | 'displayName' | 'email'; order?: 'asc' | 'desc' },
    pagination?: Pagination,
  ) {
    try {
      const where: Prisma.UserWhereInput = {
        ...(filter?.search && {
          OR: [
            { displayName: { contains: filter.search, mode: 'insensitive' } },
            { email: { contains: filter.search, mode: 'insensitive' } },
          ],
        }),
        ...(filter?.isActive !== undefined && { isActive: filter.isActive }),
      };
      
      const field = sort?.field || 'createdAt';
      const order = sort?.order || 'desc';
      const { page, limit, skip } = this.buildPagination(pagination);

      const [total, users] = await this.prisma.$transaction([
        this.prisma.user.count({ where }),
        this.prisma.user.findMany({
          where,
          orderBy: { [field]: order },
          skip,
          take: limit,
        }),
      ]);

      return {
        data: users.map((user) => ({
          ...this.serializeUser(user),
          isActive: user.isActive,
          googleLinked: !!user.googleId,
        })),
        pagination: this.buildPaginationMeta(total, page, limit),
      };
    } catch (error) {
      this.handleError(error, 'Get all users fail', ERROR.SVGETPROJECTMEMBERS);
    }
  }

  async findOne(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true }, orderBy: { roleId: 'asc' } } },
      });

      if (!user) {
        throw new NotFoundException(ERROR.NFUSER);
      }

      return {
        data: {
          ...this.serializeUser(user),
          isActive: user.isActive,
          googleLinked: !!user.googleId,
          roles: user.userRoles.map((userRole) => serializeRole(userRole.role)),
        },
      };
    } catch (error) {
      this.handleError(error, 'Get user fail', ERROR.SVGETPROJECTMEMBER);
    }
  }

  async getMe(userId: number) {
    return this.findOne(userId);
  }

  async getMeActivities(userId: number) {
    try {
      await this.ensureUser(userId);

      const tasks = await this.prisma.task.findMany({
        where: {
          OR: [{ createdBy: userId }, { updatedBy: userId }, { assignedBy: userId }],
        },
        orderBy: { updatedAt: 'desc' },
        take: ACTIVITY_LIMIT,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          file: {
            select: {
              folder: {
                select: {
                  project: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return {
        data: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          projectName: task.file.folder.project.name,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          timeLabel: this.formatRelativeTime(task.updatedAt),
        })),
      };
    } catch (error) {
      this.handleError(error, 'Get user activities fail', ERROR.SVGETTASK);
    }
  }

  async createStaffUser(currentUserId: number, dto: CreateStaffUserDto) {
    try {
      const email = dto.email.trim().toLowerCase();
      const existingUser = await this.prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        throw new ConflictException(ERROR.CFLEMAIL);
      }

      const roleIds = await this.validateSysRoles(dto.roleIds);
      const password = dto.password
        ? await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS)
        : undefined;

      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            password,
            displayName: dto.displayName?.trim(),
            avatarUrl: dto.avatarUrl,
            isActive: true,
            createdBy: currentUserId,
            updatedBy: currentUserId,
          },
        });

        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: createdUser.id, roleId })),
          skipDuplicates: true,
        });

        return createdUser;
      });

      return { data: this.serializeUser(user) };
    } catch (error) {
      this.handleError(error, 'Create staff user fail', ERROR.SVADDPROJECTMEMBER);
    }
  }

  async update(userId: number, data: UpdateUserDto & { updatedBy?: number }) {
    try {
      await this.ensureUser(userId);

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: data.email?.trim().toLowerCase(),
          password: data.password
            ? await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS)
            : undefined,
          displayName: data.displayName?.trim(),
          avatarUrl: data.avatarUrl,
          isActive: data.isActive,
          updatedBy: data.updatedBy,
        },
      });

      return { data: this.serializeUser(user) };
    } catch (error) {
      this.handleUserUniqueConflict(error);
      this.handleError(error, 'Update user fail', ERROR.SVUPDATEPROJECTMEMBER);
    }
  }

  async updateMe(userId: number, dto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          displayName: dto.displayName?.trim(),
          avatarUrl: dto.avatarUrl,
          updatedBy: userId,
        },
      });

      return { data: this.serializeUser(user) };
    } catch (error) {
      this.handleError(error, 'Update profile fail', ERROR.SVUPDATEPROJECTMEMBER);
    }
  }

  async updatePassword(userId: number, dto: UpdatePasswordDto) {
    try {
      const user = await this.ensureUser(userId);

      if (!user.password) {
        throw new UnauthorizedException(ERROR.EVLCURRENTPASSWORD);
      }

      const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException(ERROR.EVLCURRENTPASSWORD);
      }

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            password: await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS),
            updatedBy: userId,
          },
        }),
        this.prisma.refreshToken.deleteMany({ where: { userId } }),
      ]);

      return { data: { success: true } };
    } catch (error) {
      this.handleError(error, 'Update password fail', ERROR.SVUPDATEPROJECTMEMBER);
    }
  }

  async uploadAvatar(userId: number, file: AvatarUploadFile, request: Request) {
    try {
      await this.ensureUser(userId);

      const extension = AVATAR_MIME_EXTENSIONS[file.mimetype];
      if (!extension) {
        throw new BadRequestException('Avatar must be a JPG, PNG, WEBP, or GIF image.');
      }

      if (file.size > AVATAR_MAX_SIZE) {
        throw new BadRequestException('Avatar must be 5MB or smaller.');
      }

      await fs.mkdir(AVATAR_UPLOAD_DIR, { recursive: true });

      const originalExtension = extname(file.originalname).toLowerCase();
      const fileExtension = originalExtension || extension;
      const fileName = `${userId}-${randomUUID()}${fileExtension}`;
      const filePath = join(AVATAR_UPLOAD_DIR, fileName);

      await fs.writeFile(filePath, file.buffer);

      const protocol = request.protocol;
      const host = request.get('host');

      return {
        data: {
          avatarUrl: `${protocol}://${host}/uploads/avatars/${fileName}`,
        },
      };
    } catch (error) {
      this.handleError(error, 'Upload avatar fail', ERROR.SVUPDATEPROJECTMEMBER);
    }
  }

  async delete(userId: number) {
    try {
      await this.ensureUser(userId);
      await this.prisma.user.delete({ where: { id: userId } });
      return { data: { success: true } };
    } catch (error) {
      this.handleError(error, 'Delete user fail', ERROR.SVREMOVEPROJECTMEMBER);
    }
  }

  async findRoles(userId: number) {
    try {
      await this.ensureUser(userId);

      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
        orderBy: { roleId: 'asc' },
      });

      return { data: userRoles.map((userRole) => serializeRole(userRole.role)) };
    } catch (error) {
      this.handleError(error, 'Get user roles fail', ERROR.SVGETBOARDMEMBERS);
    }
  }

  async appendRoles(userId: number, roleIds: number[]) {
    try {
      await this.ensureUser(userId);
      const validRoleIds = await this.validateSysRoles(roleIds);

      await this.prisma.userRole.createMany({
        data: validRoleIds.map((roleId) => ({ userId, roleId })),
        skipDuplicates: true,
      });

      return { data: { success: true } };
    } catch (error) {
      this.handleError(error, 'Append user roles fail', ERROR.SVADDBOARDMEMBER);
    }
  }

  async replaceRoles(userId: number, roleIds: number[]) {
    try {
      await this.ensureUser(userId);
      const validRoleIds = await this.validateSysRoles(roleIds);

      await this.prisma.$transaction(async (tx) => {
        await tx.userRole.deleteMany({ where: { userId } });

        if (validRoleIds.length > 0) {
          await tx.userRole.createMany({
            data: validRoleIds.map((roleId) => ({ userId, roleId })),
            skipDuplicates: true,
          });
        }
      });

      return { data: { success: true } };
    } catch (error) {
      this.handleError(error, 'Replace user roles fail', ERROR.SVUPDBOARDMEMBER);
    }
  }

  async findProjects(userId: number) {
    try {
      await this.ensureUser(userId);

      const userProjects = await this.prisma.userProject.findMany({
        where: { userId },
        include: {
          project: {
            include: {
              projectStats: {
                orderBy: { updatedAt: 'desc' },
                take: 1,
              },
            },
          },
          role: true,
        },
        orderBy: [{ projectId: 'asc' }, { roleId: 'asc' }],
      });

      return {
        data: userProjects.map((userProject) => ({
          ...userProject.project,
          role: serializeRole(userProject.role),
          assignedAt: userProject.createdAt,
          updatedAt: userProject.updatedAt,
        })),
      };
    } catch (error) {
      this.handleError(error, 'Get user projects fail', ERROR.SVGETBOARDPROJECTS);
    }
  }

  async findEditorBoards(userId: number) {
    try {
      await this.ensureUser(userId);

      const userEditorBoards = await this.prisma.userEditorBoard.findMany({
        where: { userId },
        include: { editorBoard: true },
        orderBy: { editorBoardId: 'asc' },
      });

      return {
        data: userEditorBoards.map((userEditorBoard) => ({
          ...userEditorBoard.editorBoard,
          isLead: userEditorBoard.isLead,
        })),
      };
    } catch (error) {
      this.handleError(error, 'Get user editor boards fail', ERROR.SVGETBOARDS);
    }
  }

  async linkGoogleAccount(state: string | undefined, googleUser: GoogleUser) {
    try {
      let userId: number;
      try {
        userId = this.verifyGoogleLinkState(state);
      } catch {
        return this.buildFrontendUrl('/auth/oauth-error?reason=invalid_state');
      }

      if (!googleUser.email || !googleUser.googleId) {
        return this.buildFrontendUrl('/auth/oauth-error?reason=invalid_google_account');
      }

      const linkedUser = await this.prisma.user.findUnique({
        where: { googleId: googleUser.googleId },
      });

      if (linkedUser && linkedUser.id !== userId) {
        return this.buildFrontendUrl('/auth/oauth-error?reason=google_account_already_linked');
      }

      const currentUser = await this.ensureUser(userId);
      const googleEmail = googleUser.email.trim().toLowerCase();
      if (currentUser.email.trim().toLowerCase() !== googleEmail) {
        return this.buildFrontendUrl('/auth/oauth-error?reason=email_mismatch');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl ?? currentUser.avatarUrl,
          displayName: currentUser.displayName ?? googleUser.displayName,
          isActive: true,
          updatedBy: userId,
        },
      });

      return this.buildFrontendUrl('/auth/oauth-success?linked=google');
    } catch (error) {
      this.handleError(error, 'Link Google account fail', ERROR.SVUPDATEBOARD);
    }
  }

  private async validateSysRoles(roleIds: number[]) {
    const uniqueRoleIds = [...new Set(roleIds.map(Number))];
    const roles = await this.prisma.role.findMany({
      where: { id: { in: uniqueRoleIds }, scope: SCOPE.SYS },
    });

    if (roles.length !== uniqueRoleIds.length) {
      throw new BadRequestException(ERROR.EVLSYSROLES);
    }

    return uniqueRoleIds;
  }

  private verifyGoogleLinkState(state: string | undefined) {
    if (!state) {
      throw new BadRequestException(ERROR.EVLGOOGLELINKSTATE);
    }

    try {
      const payload = this.jwtService.verify<{ userId?: number }>(state, {
        secret: requireEnv('ACCESS_TOKEN_SECRET'),
      });

      if (!payload.userId) {
        throw new BadRequestException(ERROR.EVLGOOGLELINKSTATE);
      }

      return payload.userId;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(ERROR.EVLGOOGLELINKSTATE);
    }
  }

  private buildFrontendUrl(path: string): string {
    const baseUrl = requireEnv('WEB_ORIGIN');
    return `${baseUrl.replace(/\/$/, '')}${path}`;
  }

  async getUserPermissions(
    userId: number,
    resource?: Resource,
    resourceId?: number,
  ): Promise<Permission[]> {
    try {
      let permissions = [] as Permission[];
      if (!resource || !resourceId) {
        permissions = permissions.concat(await this.getGlobalPermission(userId));
      }

      switch (resource) {
        case 'BOARD':
          permissions = permissions.concat(await this.getBoardPermission(userId, resourceId!));
          break;
        case 'PROJECT':
          permissions = permissions.concat(await this.getProjectPermission(userId, resourceId!));
          break;
        case 'FOLDER':
          permissions = permissions.concat(await this.getFolderPermission(userId, resourceId!));
          break;
        case 'FILE':
          permissions = permissions.concat(await this.getFilePermission(userId, resourceId!));
          break;
        case 'MATERIAL':
          permissions = permissions.concat(await this.getMaterialPermission(userId, resourceId!));
          break;
        case 'TASK':
          permissions = permissions.concat(await this.getTaskPermission(userId, resourceId!));
          break;
        case 'FRAME':
          permissions = permissions.concat(await this.getFramePermission(userId, resourceId!));
          break;
        case 'COMMENT':
          permissions = permissions.concat(await this.getCommentPermission(userId, resourceId!));
          break;
        case 'APPLICATION':
          permissions = permissions.concat(
            await this.getApplicationPermission(userId, resourceId!),
          );
          break;
      }

      return permissions;
    } catch (error) {
      this.logger.error('Error fetching user permissions:', error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(ERROR.SVPERMISSION);
    }
  }

  private async getGlobalPermission(userId: number): Promise<Permission[]> {
    const permissions = await this.prisma.$queryRaw<[{ name: Permission }]>`
        SELECT DISTINCT p.name
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ${userId}
      `;
    return permissions.map((p) => p.name as Permission);
  }

  private async getBoardPermission(userId: number, editorBoardId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Check if user is a board member
    // If not, throw 403 error
    const userEditorBoard = await this.prisma.userEditorBoard.findUnique({
      where: {
        userId_editorBoardId: {
          userId,
          editorBoardId,
        },
      },
    });

    if (!userEditorBoard) {
      throw new ForbiddenException();
    }

    // If yes, get permission
    const board = await this.prisma.editorBoard.findUnique({ where: { id: editorBoardId } });

    if (board?.createdBy === userId) {
      permissions.push('board:owner');
    } else {
      if (userEditorBoard.isLead) {
        permissions.push('board:leader');
      } else {
        permissions.push('board:member');
      }
    }

    return permissions;
  }

  private async getProjectPermission(userId: number, projectId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Check if user is a project member
    // If not, throw 403 error
    const isMember = await this.isProjectMember(userId, projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // If yes, get permission
    permissions = permissions.concat(await this.getProjectOwnerPermission(userId, projectId));
    if (permissions.length === 0) {
      permissions = permissions.concat(await this.getProjectMemberPermission(userId, projectId));
    }
    return permissions;
  }

  private async getFolderPermission(userId: number, folderId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Get projectId from folderId
    const folder = await this.prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      throw new NotFoundException(ERROR.NFFOLDER);
    }

    // Check if user is a project member
    // If not, throw 403 error
    const isMember = await this.isProjectMember(userId, folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // If yes, get permission
    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, folder.projectId),
    );
    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, folder.projectId),
      );
    }

    return permissions;
  }

  private async getFilePermission(userId: number, fileId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Get projectId from fileId
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: { folder: { select: { projectId: true } } },
    });
    if (!file) {
      throw new NotFoundException(ERROR.NFFILE);
    }

    // Check if user is a project member
    // If not, throw 403 error
    const isMember = await this.isProjectMember(userId, file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // If yes, get permission
    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, file.folder.projectId),
    );
    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, file.folder.projectId),
      );
    }

    return permissions;
  }

  private async getMaterialPermission(userId: number, materialId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Get projectId from materialId
    const material = await this.prisma.fileMaterial.findUnique({
      where: { id: materialId },
      select: { file: { select: { folder: { select: { projectId: true } } } } },
    });
    if (!material) {
      throw new NotFoundException(ERROR.NFMATERIAL);
    }

    // Check if user is a project member
    // If not, throw 403 error
    const isMember = await this.isProjectMember(userId, material.file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // If yes, get permission
    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, material.file.folder.projectId),
    );

    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, material.file.folder.projectId),
      );
    }

    return permissions;
  }

  private async getTaskPermission(userId: number, taskId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Get projectId from taskId
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { file: { select: { folder: { select: { projectId: true } } } } },
    });
    if (!task) {
      throw new NotFoundException(ERROR.NFTASK);
    }

    // Check if user is a project member
    // If not, throw 403 error
    const isMember = await this.isProjectMember(userId, task.file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // If yes, get permission
    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, task.file.folder.projectId),
    );
    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, task.file.folder.projectId),
      );
    }

    return permissions;
  }

  private async getFramePermission(userId: number, frameId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Get projectId from frameId
    const frame = await this.prisma.taskCommentFrame.findUnique({
      where: { id: frameId },
      select: {
        task: { select: { file: { select: { folder: { select: { projectId: true } } } } } },
      },
    });
    if (!frame) {
      throw new NotFoundException(ERROR.NFFRAME);
    }

    // Check if user is a project member
    // If not, throw 403 error
    const isMember = await this.isProjectMember(userId, frame.task.file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // If yes, get permission
    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, frame.task.file.folder.projectId),
    );
    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, frame.task.file.folder.projectId),
      );
    }

    return permissions;
  }

  private async getCommentPermission(userId: number, commentId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Get projectId from commentId
    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
      select: {
        frame: {
          select: {
            task: { select: { file: { select: { folder: { select: { projectId: true } } } } } },
          },
        },
      },
    });
    if (!comment) {
      throw new NotFoundException(ERROR.NFCOMMENT);
    }

    // Check if user is a project member
    // If not, throw 403 error
    const isMember = await this.isProjectMember(userId, comment.frame.task.file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // If yes, get permission
    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, comment.frame.task.file.folder.projectId),
    );
    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, comment.frame.task.file.folder.projectId),
      );
    }

    return permissions;
  }

  private async getApplicationPermission(
    userId: number,
    applicationId: number,
  ): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Get application from applicationId
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { projectId: true },
    });
    if (!application) {
      throw new NotFoundException(ERROR.NFAPPLICATION);
    }

    // Check if user is a project member
    // If not, throw 403 error
    const isMember = await this.isProjectMember(userId, application.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // If yes, get permission based on project permissions
    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, application.projectId),
    );
    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, application.projectId),
      );
    }

    // Add application permissions based on role
    if (permissions.includes('project:owner')) {
      permissions.push('project:application.approve');
    }

    return permissions;
  }

  private async isProjectMember(userId: number, projectId: number): Promise<boolean> {
    const userProject = await this.prisma.userProject.count({
      where: {
        userId,
        projectId,
      },
    });
    return !!userProject;
  }

  private async getProjectOwnerPermission(
    userId: number,
    projectId: number,
  ): Promise<Permission[]> {
    let permissions = [] as Permission[];
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (project?.createdBy === userId) {
      permissions.push('project:owner');
    }
    return permissions;
  }

  private async getProjectMemberPermission(
    userId: number,
    projectId: number,
  ): Promise<Permission[]> {
    // Find user role in project
    // Join role_permission to get permissions of that role
    // Select permission.name
    const permissions = await this.prisma.$queryRaw<[{ name: Permission }]>`
      SELECT DISTINCT p.name
      FROM user_projects up
      JOIN role_permissions rp ON up.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE up.user_id = ${userId} AND up.project_id = ${projectId}
    `;

    return permissions.map((p) => p.name as Permission);
  }

  private async ensureUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ERROR.NFUSER);
    }

    return user;
  }

  private async ensureRole(roleId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException(ERROR.NFROLE);
    }

    return role;
  }

  private handleUserUniqueConflict(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target)
    ) {
      if (error.meta.target.includes('email')) {
        throw new ConflictException(ERROR.CFLEMAIL);
      }

      if (error.meta.target.includes('google_id')) {
        throw new ConflictException(ERROR.CFLGOOGLEACCOUNT);
      }
    }
  }

  private buildPagination(pagination?: Pagination) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    return { page, limit, skip: (page - 1) * limit };
  }

  private buildPaginationMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private serializeUser(user: {
    id: number;
    displayName: string | null;
    avatarUrl: string | null;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private formatRelativeTime(date: Date) {
    const diffInMs = Date.now() - date.getTime();
    const diffInMinutes = Math.max(0, Math.floor(diffInMs / 60000));

    if (diffInMinutes < 1) {
      return 'Just now';
    }

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    }

    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
