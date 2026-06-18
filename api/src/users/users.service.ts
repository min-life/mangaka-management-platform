import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { Resource, Permission } from '../auth/interfaces';

const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({ orderBy: { id: 'asc' } });
    return { data: users.map(this.serializeUser) };
  }

  async findOne(userId: number) {
    const user = await this.ensureUser(userId);
    return { data: this.serializeUser(user) };
  }

  async getMe(userId: number) {
    return this.findOne(userId);
  }

  async create(data: {
    email: string;
    password?: string;
    displayName?: string;
    avatarUrl?: string;
    createdBy?: number;
  }) {
    const email = data.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException(ERROR.CFLEMAIL);
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        password: data.password ? await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS) : undefined,
        displayName: data.displayName?.trim(),
        avatarUrl: data.avatarUrl,
        isActive: true,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    });

    return { data: this.serializeUser(user) };
  }

  async update(
    userId: number,
    data: {
      email?: string;
      password?: string;
      displayName?: string;
      avatarUrl?: string;
      updatedBy?: number;
    },
  ) {
    await this.ensureUser(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email?.trim().toLowerCase(),
        password: data.password ? await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS) : undefined,
        displayName: data.displayName?.trim(),
        avatarUrl: data.avatarUrl,
        updatedBy: data.updatedBy,
      },
    });

    return { data: this.serializeUser(user) };
  }

  async updateCurrentUserDisplayName(userId: number, displayName: string) {
    const result = await this.update(userId, { displayName, updatedBy: userId });
    return result.data;
  }

  async delete(userId: number) {
    await this.ensureUser(userId);
    await this.prisma.user.delete({ where: { id: userId } });
    return { data: { success: true } };
  }

  async assignRole(userId: number, roleId: number) {
    await this.ensureUser(userId);
    await this.ensureRole(roleId);

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });

    return { data: { success: true } };
  }

  async removeRole(userId: number, roleId: number) {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return { data: { success: true } };
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
      }

      return permissions;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensureRole(roleId: number) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
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
