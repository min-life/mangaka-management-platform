import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';

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
      throw new ConflictException(ERROR.CFLNAIL);
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

  async getUserPermissions(userId: number, projectId?: number) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
    const projectRoles = projectId
      ? await this.prisma.userProject.findMany({
          where: { userId, projectId },
          include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
        })
      : [];

    return [...userRoles, ...projectRoles].flatMap((row) =>
      row.role.rolePermissions.map((rolePermission) => rolePermission.permission.name),
    );
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
