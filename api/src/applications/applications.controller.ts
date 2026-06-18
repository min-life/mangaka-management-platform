import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Permissions } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { ApplicationsService } from './applications.service';
import {
  ApplicationResponseDto,
  ApplicationsResponseDto,
  QueryApplicationsReqDto,
  UpdateApplicationReqDto,
  UpdateApplicationStatusReqDto,
} from './dto';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Permissions({
    mode: 'ANY',
    permissions: ['project:application.read', 'board:leader'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Get applications' })
  @ApiOkResponse({
    description: 'Applications retrieved successfully',
    type: ApplicationsResponseDto,
  })
  @Get()
  async getApplications(@Query() query: QueryApplicationsReqDto) {
    const result = await this.applicationsService.getApplications(
      {
        projectId: query.projectId,
        search: query.search,
        type: query.type,
        status: query.status,
      },
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: result.applications,
      pagination: result.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:application.read', 'board:leader'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Get application details' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({
    description: 'Application retrieved successfully',
    type: ApplicationResponseDto,
  })
  @Get(':id')
  async getApplicationById(@Param('id', ParseIntPipe) id: number) {
    const application = await this.applicationsService.getApplicationById(id);
    return {
      data: application,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:application.update', 'board:leader'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Update application' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({ description: 'Application updated successfully', type: ApplicationResponseDto })
  @Patch(':id')
  async updateApplication(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateApplicationReqDto,
  ) {
    const application = await this.applicationsService.updateApplication(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: application,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:application.delete', 'board:leader'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Delete application' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({ description: 'Application deleted successfully' })
  @Delete(':id')
  async deleteApplication(@Param('id', ParseIntPipe) id: number) {
    await this.applicationsService.deleteApplication(id);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:application.approve', 'board:leader'],
    resource: 'APPLICATION',
  })
  @ApiOperation({ summary: 'Update application status' })
  @ApiParam({ name: 'id', type: Number, description: 'Application id' })
  @ApiOkResponse({
    description: 'Application status updated successfully',
    type: ApplicationResponseDto,
  })
  @Patch(':id/status')
  async updateApplicationStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateApplicationStatusReqDto,
  ) {
    const application = await this.applicationsService.updateApplicationStatus(id, {
      status: data.status,
      userId: currentUser.userId,
    });
    return {
      data: application,
    };
  }
}
