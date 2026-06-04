import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SCOPE } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DEFAULT_ROLE_CODES, isDefaultRole } from './role-default';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  //Hàm kiểm tra xem user có thuộc scope SYS và có phải là role admin của scope để có thể quản lí role của Platform không.
  private async assertCanManagePlatformRoles(currentUserId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          scope: SCOPE.SYS,
          code: 'admin',
        },
      },
    });
    if (!userRole) {
      throw new ForbiddenException('You do not have permissions to manage Platform role.');
    }
  }

  //Hàm kiểm tra xem user có thuộc scope CO để có thể access vào company không
  private async assertCanAccessCompanyRoles(currentUserId: bigint, companyId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          OR: [
            {
              scope: SCOPE.CO,
              code: 'admin',
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
      throw new ForbiddenException('You do not have permissions to access this company');
    }
  }

  //Hàm kiểm tra xem user có thuộc scope CO và có role là co_admin để có thể quản lí role của company không
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
      throw new ForbiddenException('You do not have permissions to manage company roles. ');
    }
  }

  //Hàm kiểm tra xem user có scope PRJ để có thể access vào project không
  private async assertCanAccessProjectRoles(currentUserId: bigint, projectId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          scope: SCOPE.PRJ,
          projectId,
        },
      },
    });
    if (!userRole) {
      throw new ForbiddenException('You do not have permissions to access this project');
    }
  }

  //Hàm kiểm tra xem user có scope PRJ và role manager để có thể quản lí role của project không
  private async assertCanManageProjectRoles(currentUserId: bigint, projectId: bigint) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId: currentUserId,
        role: {
          scope: SCOPE.PRJ,
          projectId,
          code: 'manager',
        },
      },
    });
    if (!userRole) {
      throw new ForbiddenException('You do not have permissions to manage project roles. ');
    }
  }

  private async assertCanAccessRole(
    currentUserId: bigint,
    role: Prisma.RoleGetPayload<{ include: { project: true } }>,
  ) {
    if (role.scope === SCOPE.SYS) {
      // Chỉ system admin được xem
      await this.assertCanManagePlatformRoles(currentUserId);
      return;
    }

    if (role.scope === SCOPE.CO) {
      // Nếu không có companyId thì đây có thể là default CO role
      if (!role.companyId) {
        return;
      }

      // Nếu có companyId thì user phải access được company
      await this.assertCanAccessCompanyRoles(currentUserId, role.companyId);
      return;
    }

    if (role.scope === SCOPE.PRJ) {
      // Nếu không có projectId thì đây có thể là default PRJ role
      if (!role.projectId) {
        return;
      }

      // Nếu có projectId thì user phải access được project
      await this.assertCanAccessProjectRoles(currentUserId, role.projectId);
    }
  }

  // Không tạo mới code của role trùng với code của role default
  private assertNotReservedDefaultCode(scope: SCOPE, code?: string | null) {
    // Nếu code thuộc default role của scope này
    if (isDefaultRole(scope, code)) {
      throw new ForbiddenException('Cannot use reserved default role code');
    }
  }

  //List tất cả các role cho Admin Platform
  async findPlatformRoles(currentUserId: bigint) {
    await this.assertCanManagePlatformRoles(currentUserId);

    const roles = await this.prisma.role.findMany({
      where: {
        OR: [
          //List toàn bộ role thuộc scope SYS
          {
            scope: SCOPE.SYS,
          },
          //List toàn bộ role default thuộc scope CO (role default <=> companyId và projectId = null)
          {
            scope: SCOPE.CO,
            code: { in: DEFAULT_ROLE_CODES[SCOPE.CO] },
            companyId: null,
            projectId: null,
          },
          //List toàn bộ role default thuộc scope PRJ
          {
            scope: SCOPE.PRJ,
            code: { in: DEFAULT_ROLE_CODES[SCOPE.PRJ] },
            companyId: null,
            projectId: null,
          },
        ],
      },
    });
    //Convert dữ liệu Prisma sang response JSON
    return roles.map((role) => this.serializeRole(role));
  }

  //List tất cả role cho Company Role Management Page
  async findCompanyRoles(currentUserId: bigint, companyId: bigint) {
    await this.assertCanAccessCompanyRoles(currentUserId, companyId);

    const roles = await this.prisma.role.findMany({
      where: {
        scope: SCOPE.CO,
        OR: [
          //Lấy các role default thuộc scope CO
          {
            code: { in: DEFAULT_ROLE_CODES[SCOPE.CO] },
            companyId: null,
            projectId: null,
          },

          //Lấy những role được tạo mới thuộc scope CO
          {
            companyId,
          },
        ],
      },
    });
    return roles.map((role) => this.serializeRole(role));
  }

  //List tất cả role cho Project Role Management Page
  async findProjectRoles(currentUserId: bigint, projectId: bigint) {
    await this.assertCanAccessProjectRoles(currentUserId, projectId);

    const roles = await this.prisma.role.findMany({
      where: {
        scope: SCOPE.PRJ,
        OR: [
          {
            code: { in: DEFAULT_ROLE_CODES[SCOPE.PRJ] },
            companyId: null,
            projectId: null,
          },
          {
            projectId,
          },
        ],
      },
    });
    return roles.map((role) => this.serializeRole(role));
  }

  async findOne(currentUserId: bigint, roleId: bigint) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },

      include: { project: true },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Kiểm tra user có quyền xem role này không
    await this.assertCanAccessRole(currentUserId, role);

    return this.serializeRole(role);
  }

  async createPlatformRole(currentUserId: bigint, dto: CreateRoleDto) {
    await this.assertCanManagePlatformRoles(currentUserId);

    this.assertNotReservedDefaultCode(SCOPE.SYS, dto.code);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        scope: SCOPE.SYS,
        companyId: null,
        projectId: null,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      },
    });
    return this.serializeRole(role);
  }

  async createCompanyRole(currentUserId: bigint, companyId: bigint, dto: CreateRoleDto) {
    await this.assertCanAccessCompanyRoles(currentUserId, companyId);

    this.assertNotReservedDefaultCode(SCOPE.CO, dto.code);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        scope: SCOPE.SYS,
        companyId,
        //role thuộc scope CO không thuộc project
        projectId: null,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      },
    });
    return this.serializeRole(role);
  }

  async createProjectRole(currentUserId: bigint, projectId: bigint, dto: CreateRoleDto) {
    await this.assertCanAccessProjectRoles(currentUserId, projectId);

    this.assertNotReservedDefaultCode(SCOPE.PRJ, dto.code);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        scope: SCOPE.SYS,
        companyId: null,
        projectId,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      },
    });
    return this.serializeRole(role);
  }

  async updateRole(currentUserId: bigint, roleId: bigint, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },

      // Include project để phục vụ kiểm tra quyền với role PRJ
      include: {
        project: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (isDefaultRole(role.scope, role.code)) {
      throw new ForbiddenException('Default role cannot be updated');
    }

    if (dto.code) {
      this.assertNotReservedDefaultCode(role.scope, dto.code);
    }

    await this.assertCanAccessRole(currentUserId, role);

    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: dto.name,
        code: dto.code,
        updatedBy: currentUserId,
      },
    });
    return this.serializeRole(updatedRole);
  }

  async deleteRole(currentUserId: bigint, roleId: bigint) {
    const role = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },

      include: {
        project: true,
      },
    });

    // Nếu role không tồn tại thì trả 404
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Nếu role là default role thì cấm delete
    if (isDefaultRole(role.scope, role.code)) {
      throw new ForbiddenException('Default role cannot be deleted');
    }

    // Kiểm tra user có quyền quản lý role này không
    await this.assertCanAccessRole(currentUserId, role);

    // Đếm xem role này đang được gán cho bao nhiêu user
    const assignedCount = await this.prisma.userRole.count({
      where: { roleId },
    });

    // Nếu role đang được gán cho user thì không cho xóa
    if (assignedCount > 0) {
      throw new ForbiddenException('Role is assigned to users');
    }

    await this.prisma.role.delete({
      where: { id: roleId },
    });

    // Trả kết quả xóa thành công
    return { success: true };
  }

  //Convert Prisma role object sang JSON response
  private serializeRole(role: {
    id: bigint;
    name: string;
    code: string | null;
    scope: SCOPE;
    companyId: bigint | null;
    projectId: bigint | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const defaultRole = isDefaultRole(role.scope, role.code);

    // Trả object JSON-safe cho client.
    return {
      //  Các kiểu BigInt không serialize JSON được nên đổi sang string.
      id: role.id.toString(),
      name: role.name,
      code: role.code,
      scope: role.scope,

      companyId: role.companyId?.toString() ?? null,

      projectId: role.projectId?.toString() ?? null,

      // Field isDefault này computed, không có trong DB.
      isDefault: defaultRole,

      // Default role không được edit.
      canEdit: !defaultRole,

      // Default role không được delete.
      canDelete: !defaultRole,

      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
