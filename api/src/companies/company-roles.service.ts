import { ForbiddenException, Injectable } from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { ROLE_MESSAGES } from '../roles/role-messages';
import { serializeRole } from '../roles/role-serializer';

@Injectable()
export class CompanyRolesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCanAccessCompanyRoles(currentUserId: bigint, companyId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          OR: [
            {
              scope: SCOPE.CO,
              code: 'co_admin',
              companyId,
            },
            {
              scope: SCOPE.PRJ,
              project: {
                companyId,
              },
            },
          ],
        },
      },
    });

    if (!userRole) {
      throw new ForbiddenException(ROLE_MESSAGES.CANNOT_ACCESS_COMPANY);
    }
  }

  private async assertCanManageCompanyRoles(currentUserId: bigint, companyId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          scope: SCOPE.CO,
          companyId,
          code: 'co_admin',
        },
      },
    });

    if (!userRole) {
      throw new ForbiddenException(ROLE_MESSAGES.CANNOT_MANAGE_COMPANY_ROLES);
    }
  }

  async findCompanyRoles(currentUserId: bigint, companyId: bigint) {
    await this.assertCanAccessCompanyRoles(currentUserId, companyId);

    const roles = await this.prisma.role.findMany({
      where: {
        scope: SCOPE.CO,
        OR: [
          {
            companyId: null,
            projectId: null,
          },
          {
            companyId,
          },
        ],
      },
    });

    return {
      message: ROLE_MESSAGES.COMPANY_ROLES_FOUND,
      data: roles.map((role) => serializeRole(role)),
    };
  }

  async createCompanyRole(currentUserId: bigint, companyId: bigint, dto: CreateRoleDto) {
    await this.assertCanManageCompanyRoles(currentUserId, companyId);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        scope: SCOPE.CO,
        companyId,
        projectId: null,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      },
    });

    return {
      message: ROLE_MESSAGES.COMPANY_ROLE_CREATED,
      data: serializeRole(role),
    };
  }
}
