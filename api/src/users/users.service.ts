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
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import {
  requireDurationEnv,
  requireDurationStringEnv,
  requireEnv,
  requireNumberEnv,
} from '../share/helpers/env';
import { serializeRole } from '../share/utils/role-serializer';
import { Resource, Permission, GoogleUser } from '../auth/interfaces';
import { Pagination } from '../share/interfaces';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_SALT_ROUNDS = requireNumberEnv('BCRYPT_SALT_ROUNDS');
const ACCESS_TOKEN_EXPIRES_IN = requireDurationStringEnv('ACCESS_TOKEN_EXPIRES_IN');
const REFRESH_TOKEN_EXPIRES_IN = requireDurationStringEnv('REFRESH_TOKEN_EXPIRES_IN');
const REFRESH_TOKEN_EXPIRES_IN_MS = requireDurationEnv('REFRESH_TOKEN_EXPIRES_IN');

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
      this.handleError(error, 'Get all users fail', ERROR.SVGETUSERS);
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
      this.handleError(error, 'Get user fail', ERROR.SVGETUSER);
    }
  }

  async getMe(userId: number) {
    return this.findOne(userId);
  }

  async createStaffUser(currentUserId: number, dto: CreateStaffUserDto) {
    try {
      const email = dto.email.trim().toLowerCase();

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
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(ERROR.CFLEMAIL);
      }
      this.handleError(error, 'Create staff user fail', ERROR.SVCREATEUSER);
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
      this.handleError(error, 'Update user fail', ERROR.SVUPDATEUSER);
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
      this.handleError(error, 'Update profile fail', ERROR.SVUPDATEUSER);
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

      const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
      if (isSamePassword) {
        throw new BadRequestException(ERROR.EVLSAMEPASSWORD);
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

      const accessToken = await this.jwtService.signAsync(
        { userId, email: user.email, jti: randomUUID() },
        { secret: requireEnv('ACCESS_TOKEN_SECRET'), expiresIn: ACCESS_TOKEN_EXPIRES_IN as any },
      );

      const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);
      const refreshToken = await this.jwtService.signAsync(
        { userId, email: user.email },
        { secret: requireEnv('REFRESH_TOKEN_SECRET'), expiresIn: REFRESH_TOKEN_EXPIRES_IN as any },
      );

      await this.prisma.refreshToken.create({
        data: { token: refreshToken, userId, expiresAt: refreshTokenExpiresAt },
      });

      return { accessToken, refreshToken, refreshTokenExpiresAt };
    } catch (error) {
      this.handleError(error, 'Update password fail', ERROR.SVUPDATEUSER);
    }
  }

  async getStats() {
    try {
      const [total, active, inactive] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: false } }),
      ]);

      return { data: { total, active, inactive } };
    } catch (error) {
      this.handleError(error, 'Get users stats fail', ERROR.SVGETUSERS);
    }
  }

  async forceResetPassword(userId: number) {
    try {
      await this.ensureUser(userId);

      const newPassword = randomUUID().slice(0, 10);
      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            password: hashedPassword,
            updatedBy: userId,
          },
        }),
        this.prisma.refreshToken.deleteMany({ where: { userId } }),
      ]);

      return { data: { newPassword } };
    } catch (error) {
      this.handleError(error, 'Force reset password fail', ERROR.SVUPDATEUSER);
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
      this.handleError(error, 'Get user roles fail', ERROR.SVGETUSERROLES);
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
      this.handleError(error, 'Append user roles fail', ERROR.SVADDUSERROLES);
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
      this.handleError(error, 'Replace user roles fail', ERROR.SVUPDATEUSERROLES);
    }
  }

  async findProjects(userId: number) {
    try {
      await this.ensureUser(userId);

      const userProjects = await this.prisma.userProject.findMany({
        where: { userId },
        include: { project: true, role: true },
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
      if (resource) {
        if (!resourceId || isNaN(resourceId)) {
          throw new ForbiddenException();
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
        case 'PROJECT_STAT':
          permissions = permissions.concat(
            await this.getProjectStatPermission(userId, resourceId!),
          );
          break;
        }
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
    const permissions = [] as Permission[];
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
    const frame = await this.prisma.materialCommentFrame.findUnique({
      where: { id: frameId },
      select: {
        material: { select: { file: { select: { folder: { select: { projectId: true } } } } } },
      },
    });
    if (!frame) {
      throw new NotFoundException(ERROR.NFFRAME);
    }

    // Check if user is a project member
    // If not, throw 403 error
    const isMember = await this.isProjectMember(userId, frame.material.file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // If yes, get permission
    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, frame.material.file.folder.projectId),
    );
    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, frame.material.file.folder.projectId),
      );
    }

    return permissions;
  }

  private async getCommentPermission(userId: number, commentId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Get projectId from commentId
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        createdBy: true,
        file: { select: { folder: { select: { projectId: true } } } },
        task: { select: { file: { select: { folder: { select: { projectId: true } } } } } },
        frame: {
          select: {
            material: { select: { file: { select: { folder: { select: { projectId: true } } } } } },
          },
        },
        application: { select: { projectId: true } },
      },
    });
    if (!comment) {
      throw new NotFoundException(ERROR.NFCOMMENT);
    }

    const projectId =
      comment.file?.folder.projectId ||
      comment.task?.file.folder.projectId ||
      comment.frame?.material.file.folder.projectId ||
      comment.application?.projectId;

    if (!projectId) {
      throw new ForbiddenException();
    }

    // Check if user is a project member
    // If not, throw 403 error
    const isMember = await this.isProjectMember(userId, projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // If yes, get permission
    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, projectId),
    );
    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, projectId),
      );
    }

    // Give specific comment permissions if user is creator
    if (comment.createdBy === userId) {
      permissions.push('project:comment.update');
      permissions.push('project:comment.delete');
    }

    return permissions;
  }

  private async getApplicationPermission(userId: number, applicationId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // Get application from applicationId
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { projectId: true, project: { select: { editorBoardId: true, createdBy: true } } },
    });
    if (!application) {
      throw new NotFoundException(ERROR.NFAPPLICATION);
    }

    const isMember = await this.isProjectMember(userId, application.projectId);

    let isBoardMember = false;
    let boardPermissions: Permission[] = [];
    if (application.project.editorBoardId) {
      try {
        boardPermissions = await this.getBoardPermission(userId, application.project.editorBoardId);
        isBoardMember = true;
      } catch (error) {
        if (!(error instanceof ForbiddenException)) {
          throw error;
        }
      }
    }

    if (!isMember && !isBoardMember) {
      throw new ForbiddenException();
    }

    if (isMember) {
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
    }

    if (isBoardMember) {
      permissions = permissions.concat(boardPermissions);
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
    const permissions = [] as Permission[];
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

  private async getProjectStatPermission(
    userId: number,
    projectStatId: number,
  ): Promise<Permission[]> {
    let permissions = [] as Permission[];
    const projectStat = await this.prisma.projectStat.findUnique({
      where: { id: projectStatId },
      select: { projectId: true },
    });
    if (!projectStat) {
      throw new NotFoundException(ERROR.NFPROJECTSTAT);
    }

    const isMember = await this.isProjectMember(userId, projectStat.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, projectStat.projectId),
    );
    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, projectStat.projectId),
      );
    }

    return permissions;
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

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
