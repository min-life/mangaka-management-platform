import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ChuongTV #005
  async getUserPermissions(userId: bigint, companyId?: bigint, projectId?: bigint) {
    // get only permission name by userId, companyId and projectId auto select scope
    const rows = await this.prisma.$queryRaw<{ name: string }[]>`
        SELECT DISTINCT p.name
        FROM users u
            JOIN user_roles ur
                ON ur.user_id = u.id
            JOIN roles r
                ON r.id = ur.role_id
            JOIN role_permissions rp
                ON rp.role_id = r.id
            JOIN permissions p
                ON p.id = rp.permission_id
        WHERE u.id = ${userId}
            ${companyId ? Prisma.sql`AND r.company_id = ${companyId}` : Prisma.sql`AND r.company_id is null`}
            ${projectId ? Prisma.sql`AND r.project_id = ${projectId}` : Prisma.sql`AND r.project_id is null`}
        `;

    return rows.map((r) => r.name);
  }

  async updateCurrentUserDisplayName(userId: number, displayName: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: BigInt(userId),
        isDeleted: false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        displayName: displayName.trim(),
      },
    });

    return {
      id: updatedUser.id.toString(),
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      avatarUrl: updatedUser.avatarUrl,
    };
  }

  async getAdminPermission(userId: bigint, companyId?: bigint, projectId?: bigint) {
    let countCompany = 0;
    if (companyId) {
      countCompany = await this.prisma.company.count({
        where: {
          id: companyId,
          createdBy: userId,
        },
      });
    }
    let countProject = 0;
    if (projectId) {
      countProject = await this.prisma.project.count({
        where: {
          id: projectId,
          createdBy: userId,
        },
      });
    }
    const adminPermission = [] as string[];
    if (countCompany > 0) {
      adminPermission.push('co.admin');
    }
    if (countProject > 0) {
      adminPermission.push('prj.admin');
    }
    return adminPermission;
  }
}
