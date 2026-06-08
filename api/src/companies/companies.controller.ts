import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PERMISSIONS } from '@/constants/permissions.constant';
import { CurrentUser, Permissions } from '@auth/decorators';
import type { JwtPayload } from '@auth/interfaces';
import { ProjectDataRequestDto } from '@projects/dto';
import { ProjectsService } from '@projects/projects.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ChuongTV #007 start
  @Post('/:companyId/projects')
  @Permissions({
    mode: 'ALL',
    permissions: [PERMISSIONS.CREATE_PROJECT],
  })
  async createProject(
    @CurrentUser() user: JwtPayload,
    @Param('companyId') companyId: bigint,
    @Body() projectDataDto: ProjectDataRequestDto,
  ) {
    return await this.projectsService.createProject({
      companyId,
      createdBy: user?.userId,
      name: projectDataDto.name,
    });
  }

  @Get('/:companyId/projects')
  @Permissions({
    mode: 'ALL',
    permissions: [PERMISSIONS.READ_PROJECT],
  })
  async getProjects(@Param('companyId') companyId: bigint) {
    return await this.projectsService.getProjects({ companyId });
  }
  // ChuongTV #007 end
}
