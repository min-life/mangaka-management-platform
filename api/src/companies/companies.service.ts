import { Injectable, NotFoundException } from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ROLE_MESSAGES } from '../roles/constants/role-messages';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { serializeRole } from '../roles/utils/role-serializer';
import { COMPANY_MESSAGES } from './constants/company-messages';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { serializeCompany } from './utils/company-serializer';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findCompanies() {
    const companies = await this.prisma.company.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: COMPANY_MESSAGES.COMPANIES_FOUND,
      data: companies.map((company) => serializeCompany(company)),
    };
  }

  async getCompanyById(companyId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      throw new NotFoundException(COMPANY_MESSAGES.COMPANY_NOT_FOUND);
    }

    return {
      message: COMPANY_MESSAGES.COMPANY_FOUND,
      data: serializeCompany(company),
    };
  }

  async createCompany(currentUserId: bigint, dto: CreateCompanyDto) {
    const company = await this.prisma.$transaction(async (tx) => {
      const createdCompany = await tx.company.create({
        data: {
          name: dto.name,
          createdBy: currentUserId,
          updatedBy: currentUserId,
        },
      });

      const defaultCompanyRoles = await tx.role.findMany({
        where: {
          scope: SCOPE.CO,
          companyId: null,
          projectId: null,
        },
        include: {
          rolePermissions: true,
        },
      });

      for (const defaultRole of defaultCompanyRoles) {
        const clonedRole = await tx.role.create({
          data: {
            name: defaultRole.name,
            scope: SCOPE.CO,
            companyId: createdCompany.id,
            projectId: null,
            createdBy: currentUserId,
            updatedBy: currentUserId,
          },
        });

        if (defaultRole.rolePermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: defaultRole.rolePermissions.map((rolePermission) => ({
              roleId: clonedRole.id,
              permissionId: rolePermission.permissionId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return createdCompany;
    });

    return {
      message: COMPANY_MESSAGES.COMPANY_CREATED,
      data: serializeCompany(company),
    };
  }

  async updateCompany(currentUserId: bigint, companyId: bigint, dto: UpdateCompanyDto) {
    await this.getCompanyById(companyId);

    const company = await this.prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        name: dto.name,
        updatedBy: currentUserId,
      },
    });

    return {
      message: COMPANY_MESSAGES.COMPANY_UPDATED,
      data: serializeCompany(company),
    };
  }

  async deleteCompany(companyId: bigint) {
    await this.getCompanyById(companyId);

    await this.prisma.$transaction(async (tx) => {
      const projects = await tx.project.findMany({
        where: {
          companyId,
        },
        select: {
          id: true,
        },
      });

      const roleIds = await tx.role.findMany({
        where: {
          OR: [
            {
              companyId,
            },
            {
              projectId: {
                in: projects.map((project) => project.id),
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      if (roleIds.length > 0) {
        const ids = roleIds.map((role) => role.id);

        await tx.rolePermission.deleteMany({
          where: {
            roleId: {
              in: ids,
            },
          },
        });

        await tx.userRole.deleteMany({
          where: {
            roleId: {
              in: ids,
            },
          },
        });
      }

      await tx.company.delete({
        where: {
          id: companyId,
        },
      });
    });

    return {
      message: COMPANY_MESSAGES.COMPANY_DELETED,
      data: {
        success: true,
      },
    };
  }

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
