import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { ROLE_MESSAGES } from '../roles/role-messages';
import { serializeRole } from '../roles/role-serializer';

@Injectable()
export class CompanyRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findCompanyRoles(companyId: bigint) {
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

  async findCompanyRoleDetail(companyId: bigint, roleId: bigint) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
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

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    return {
      message: ROLE_MESSAGES.ROLE_FOUND,
      data: serializeRole(role),
    };
  }

  async updateCompanyRole(
    currentUserId: bigint,
    companyId: bigint,
    roleId: bigint,
    dto: UpdateRoleDto,
  ) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        scope: SCOPE.CO,
        companyId,
      },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    const updatedRole = await this.prisma.role.update({
      where: {
        id: roleId,
      },
      data: {
        name: dto.name,
        code: dto.code,
        updatedBy: currentUserId,
      },
    });

    return {
      message: ROLE_MESSAGES.ROLE_UPDATED,
      data: serializeRole(updatedRole),
    };
  }

  async deleteCompanyRole(companyId: bigint, roleId: bigint) {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        scope: SCOPE.CO,
        companyId,
      },
    });

    if (!role) {
      throw new NotFoundException(ROLE_MESSAGES.ROLE_NOT_FOUND);
    }

    if (!role.companyId) {
      throw new BadRequestException(ROLE_MESSAGES.INVALID_COMPANY_ROLE);
    }

    const assignedCount = await this.prisma.userRole.count({
      where: {
        roleId,
      },
    });

    if (assignedCount > 0) {
      throw new ConflictException(ROLE_MESSAGES.ASSIGNED_ROLE_DELETE_CONFLICT);
    }

    await this.prisma.role.delete({
      where: {
        id: roleId,
      },
    });

    return {
      message: ROLE_MESSAGES.ROLE_DELETED,
      data: {
        success: true,
      },
    };
  }
}
