import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
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
            ${companyId ? Prisma.sql`AND r.company_id = ${companyId}` : Prisma.empty}
            ${projectId ? Prisma.sql`AND r.project_id = ${projectId}` : Prisma.empty}
        `;

    return rows.map((r) => r.name);
  }
}
