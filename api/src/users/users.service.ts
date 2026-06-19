import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, SCOPE } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { requireEnv } from '../share/helpers/env';
import { serializeRole } from '../share/utils/role-serializer';
import { Resource, Permission, GoogleUser } from '../auth/interfaces';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async findAll() {
    const users = await this.prisma.user.findMany({ orderBy: { id: 'asc' } });
    return { data: users.map(this.serializeUser) };
  }

  async findOne(userId: number) {
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
  }

  async getMe(userId: number) {
    return this.findOne(userId);
  }

  async createStaffUser(currentUserId: number, dto: CreateStaffUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException(ERROR.CFLEMAIL);
    }

    const roleIds = await this.validateSysRoles(dto.roleIds);
    const password = dto.password ? await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS) : undefined;

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
  }

  async update(userId: number, data: UpdateUserDto & { updatedBy?: number }) {
    await this.ensureUser(userId);

    try {
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
      throw error;
    }
  }

  async updateMe(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName?.trim(),
        avatarUrl: dto.avatarUrl,
        updatedBy: userId,
      },
    });

    return { data: this.serializeUser(user) };
  }

  async updatePassword(userId: number, dto: UpdatePasswordDto) {
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
  }

  async delete(userId: number) {
    await this.ensureUser(userId);
    await this.prisma.user.delete({ where: { id: userId } });
    return { data: { success: true } };
  }

  async findRoles(userId: number) {
    await this.ensureUser(userId);

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
      orderBy: { roleId: 'asc' },
    });

    return { data: userRoles.map((userRole) => serializeRole(userRole.role)) };
  }

  async appendRoles(userId: number, roleIds: number[]) {
    await this.ensureUser(userId);
    const validRoleIds = await this.validateSysRoles(roleIds);

    await this.prisma.userRole.createMany({
      data: validRoleIds.map((roleId) => ({ userId, roleId })),
      skipDuplicates: true,
    });

    return { data: { success: true } };
  }

  async replaceRoles(userId: number, roleIds: number[]) {
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
  }

  async findProjects(userId: number) {
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
  }

  async findEditorBoards(userId: number) {
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
  }

  async linkGoogleAccount(state: string | undefined, googleUser: GoogleUser) {
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
  }

  private async validateSysRoles(roleIds: number[]) {
    const uniqueRoleIds = [...new Set(roleIds.map(Number))];
    const roles = await this.prisma.role.findMany({
      where: { id: { in: uniqueRoleIds }, scope: SCOPE.SYS },
    });

    if (roles.length !== uniqueRoleIds.length) {
      throw new BadRequestException('Invalid roles');
    }

    return uniqueRoleIds;
  }

  private verifyGoogleLinkState(state: string | undefined) {
    if (!state) {
      throw new BadRequestException('Invalid Google link state');
    }

    try {
      const payload = this.jwtService.verify<{ userId?: number }>(state, {
        secret: requireEnv('ACCESS_TOKEN_SECRET'),
      });

      if (!payload.userId) {
        throw new BadRequestException('Invalid Google link state');
      }

      return payload.userId;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid Google link state');
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
    // kiểm tra user có phải thành viên của board không
    // nếu không, báo lỗi 403
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

    // nếu có, lấy permission
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
    // kiểm tra user có phải thành viên của project không
    // nếu không, báo lỗi 403
    const isMember = await this.isProjectMember(userId, projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // nếu có, lấy permission
    permissions = permissions.concat(await this.getProjectOwnerPermission(userId, projectId));
    if (permissions.length === 0) {
      permissions = permissions.concat(await this.getProjectMemberPermission(userId, projectId));
    }
    return permissions;
  }

  private async getFolderPermission(userId: number, folderId: number): Promise<Permission[]> {
    let permissions = [] as Permission[];
    // lấy projectId từ folderId
    const folder = await this.prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      throw new NotFoundException(ERROR.NFFOLDER);
    }

    // kiểm tra user có phải thành viên của project không
    // nếu không, báo lỗi 403
    const isMember = await this.isProjectMember(userId, folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // nếu có, lấy permission
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
    // lấy projectId từ fileId
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: { folder: { select: { projectId: true } } },
    });
    if (!file) {
      throw new NotFoundException(ERROR.NFFILE);
    }

    // kiểm tra user có phải thành viên của project không
    // nếu không, báo lỗi 403
    const isMember = await this.isProjectMember(userId, file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // nếu có, lấy permission
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
    // lấy projectId từ materialId
    const material = await this.prisma.fileMaterial.findUnique({
      where: { id: materialId },
      select: { file: { select: { folder: { select: { projectId: true } } } } },
    });
    if (!material) {
      throw new NotFoundException(ERROR.NFMATERIAL);
    }

    // kiểm tra user có phải thành viên của project không
    // nếu không, báo lỗi 403
    const isMember = await this.isProjectMember(userId, material.file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // nếu có, lấy permission
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
    // lấy projectId từ taskId
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { file: { select: { folder: { select: { projectId: true } } } } },
    });
    if (!task) {
      throw new NotFoundException(ERROR.NFTASK);
    }

    // kiểm tra user có phải thành viên của project không
    // nếu không, báo lỗi 403
    const isMember = await this.isProjectMember(userId, task.file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // nếu có, lấy permission
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
    // lấy projectId từ frameId
    const frame = await this.prisma.taskCommentFrame.findUnique({
      where: { id: frameId },
      select: {
        task: { select: { file: { select: { folder: { select: { projectId: true } } } } } },
      },
    });
    if (!frame) {
      throw new NotFoundException(ERROR.NFFRAME);
    }

    // kiểm tra user có phải thành viên của project không
    // nếu không, báo lỗi 403
    const isMember = await this.isProjectMember(userId, frame.task.file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // nếu có, lấy permission
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
    // lấy projectId từ commentId
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

    // kiểm tra user có phải thành viên của project không
    // nếu không, báo lỗi 403
    const isMember = await this.isProjectMember(userId, comment.frame.task.file.folder.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // nếu có, lấy permission
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
    // lấy application từ applicationId
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { projectId: true },
    });
    if (!application) {
      throw new NotFoundException(ERROR.NFAPPLICATION);
    }

    // kiểm tra user có phải thành viên của project không
    // nếu không, báo lỗi 403
    const isMember = await this.isProjectMember(userId, application.projectId);
    if (!isMember) {
      throw new ForbiddenException();
    }

    // nếu có, lấy permission dựa trên project permissions
    permissions = permissions.concat(
      await this.getProjectOwnerPermission(userId, application.projectId),
    );
    if (permissions.length === 0) {
      permissions = permissions.concat(
        await this.getProjectMemberPermission(userId, application.projectId),
      );
    }

    // Thêm application permissions dựa trên role
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
    // tìm role user trong project
    // join role_permission để lấy permission của role đó
    // select permission.name
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
        throw new ConflictException('Google account is already linked.');
      }
    }
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
}
