import { Injectable } from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ROLE_MESSAGES } from '../roles/constants/role-messages';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { serializeRole } from '../roles/utils/role-serializer';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findCompanyRoles(companyId: bigint) {
    const roles = await this.prisma.role.findMany({
      where: {
        scope: SCOPE.CO,
        companyId,
      },
    });

    return {
      message: ROLE_MESSAGES.COMPANY_ROLES_FOUND,
      data: roles.map((role) => serializeRole(role)),
    };
  }

  async createCompanyRole(currentUserId: bigint, companyId: bigint, dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
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
