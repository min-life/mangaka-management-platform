import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { CurrentUser, Permissions } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { ProjectsService } from './projects.service';
import {
  AddProjectMembersReqDto,
  CreateProjectApplicationReqDto,
  CreateProjectFolderReqDto,
  CreateProjectReqDto,
  ProjectApplicationResponseDto,
  ProjectApplicationsResponseDto,
  ProjectEditorBoardResponseDto,
  ProjectFolderResponseDto,
  ProjectFoldersResponseDto,
  ProjectMemberResponseDto,
  ProjectMembersResponseDto,
  ProjectResponseDto,
  ProjectsResponseDto,
  QueryProjectApplicationsReqDto,
  QueryProjectFoldersReqDto,
  QueryProjectMembersReqDto,
  QueryProjectsReqDto,
  SetProjectEditorBoardReqDto,
  UpdateProjectMemberReqDto,
  UpdateProjectReqDto,
  CreateProjectStatReqDto,
  ProjectStatResponseDto,
  SuccessResponseDto,
} from './dto';
import { ActivityLogsResponseDto } from '../activity-logs/dto';
import { TasksResponseDto } from '../tasks/dto';
import { QueryMyTasksReqDto } from '../tasks/dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { QueryActivityLogsReqDto } from '../activity-logs/dto';
@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @ApiOperation({ summary: 'Get projects' })
  @ApiOkResponse({ description: 'Projects retrieved successfully', type: ProjectsResponseDto })
  @Get()
  async getProjects(@CurrentUser() currentUser: JwtPayload, @Query() query: QueryProjectsReqDto) {
    const result = await this.projectsService.getProjects(
      currentUser.userId,
      { name: query.name, me: query.me },
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: result.projects,
      pagination: result.pagination,
    };
  }

  @ApiOperation({ summary: 'Create project' })
  @ApiCreatedResponse({ description: 'Project created successfully', type: ProjectResponseDto })
  @Post()
  async createProject(@CurrentUser() currentUser: JwtPayload, @Body() data: CreateProjectReqDto) {
    const project = await this.projectsService.createProject({
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: project,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Get all tasks of current user in a specific project' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({
    description: 'User tasks in project retrieved successfully',
    type: TasksResponseDto,
  })
  @Get(':id/tasks')
  async getMyProjectTasks(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: QueryMyTasksReqDto,
  ) {
    if (query.me !== true) {
      return {
        data: [],
        pagination: {
          total: 0,
          page: query.page || 1,
          limit: query.limit || 10,
          totalPages: 1,
        },
      };
    }
    const result = await this.projectsService.getMyProjectTasks(
      id,
      currentUser.userId,
      { search: query.search, status: query.status },
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: result.tasks,
      pagination: result.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:read'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Get project details' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({ description: 'Project retrieved successfully', type: ProjectResponseDto })
  @Get(':id')
  async getProjectById(@Param('id', ParseIntPipe) id: number) {
    const project = await this.projectsService.getProjectById(id);
    return {
      data: project,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:update'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Update project' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({ description: 'Project updated successfully', type: ProjectResponseDto })
  @Patch(':id')
  async updateProject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateProjectReqDto,
  ) {
    const project = await this.projectsService.updateProject(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: project,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:delete'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Delete project' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({ description: 'Project deleted successfully', type: SuccessResponseDto })
  @Delete(':id')
  async deleteProject(@Param('id', ParseIntPipe) id: number) {
    await this.projectsService.deleteProject(id);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:member.read'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Get project members' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({
    description: 'Project members retrieved successfully',
    type: ProjectMembersResponseDto,
  })
  @Get(':id/members')
  async getProjectMembers(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryProjectMembersReqDto,
  ) {
    const members = await this.projectsService.getProjectMembers(
      id,
      { search: query.search },
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: members.data,
      pagination: members.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:member.add'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Add members to project' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiCreatedResponse({ description: 'Members added successfully' })
  @Post(':id/members')
  async addMembersToProject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: AddProjectMembersReqDto,
  ) {
    await this.projectsService.addMembersToProject(
      id,
      data.userIds,
      data.roleId,
      currentUser.userId,
    );
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:member.read'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Get project member details' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiParam({ name: 'userId', type: Number, description: 'User id' })
  @ApiOkResponse({
    description: 'Project member retrieved successfully',
    type: ProjectMemberResponseDto,
  })
  @Get(':id/members/:userId')
  async getProjectMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const member = await this.projectsService.getProjectMember(id, userId);
    return {
      data: member,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:member.update'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Update project member role' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiParam({ name: 'userId', type: Number, description: 'User id' })
  @ApiOkResponse({
    description: 'Project member updated successfully',
    type: ProjectMemberResponseDto,
  })
  @Patch(':id/members/:userId')
  async updateProjectMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateProjectMemberReqDto,
  ) {
    const member = await this.projectsService.updateProjectMember(
      id,
      userId,
      data.roleId,
      currentUser.userId,
    );
    return {
      data: member,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:member.remove'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Remove member from project' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiParam({ name: 'userId', type: Number, description: 'User id' })
  @ApiOkResponse({ description: 'Project member removed successfully', type: SuccessResponseDto })
  @Delete(':id/members/:userId')
  async removeProjectMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    await this.projectsService.removeProjectMember(id, userId, currentUser.userId);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Leave project' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({ description: 'Successfully left the project', type: SuccessResponseDto })
  @Delete(':id/members/me')
  async leaveProject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    await this.projectsService.leaveProject(id, currentUser.userId);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:read'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Get project editor board' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({
    description: 'Project editor board retrieved successfully',
    type: ProjectEditorBoardResponseDto,
  })
  @Get(':id/editor-boards')
  async getProjectEditorBoard(@Param('id', ParseIntPipe) id: number) {
    const board = await this.projectsService.getProjectEditorBoard(id);
    return {
      data: board,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:read'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Get activity logs for a project' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({ description: 'Project activity logs retrieved successfully', type: ActivityLogsResponseDto })
  @Get(':id/activity-logs')
  async getProjectActivityLogs(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryActivityLogsReqDto,
  ) {
    return await this.activityLogsService.getActivityLogs({
      ...query,
      projectId: id,
    });
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:update'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Set project editor board' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({
    description: 'Project editor board updated successfully',
    type: ProjectResponseDto,
  })
  @Post(':id/editor-boards')
  async setProjectEditorBoard(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: SetProjectEditorBoardReqDto,
  ) {
    const project = await this.projectsService.setProjectEditorBoard(
      id,
      data.editorBoardId,
      currentUser.userId,
    );
    return {
      data: project,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:update'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Remove project editor board' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({
    description: 'Project editor board removed successfully',
    type: ProjectResponseDto,
  })
  @Delete(':id/editor-boards')
  async removeProjectEditorBoard(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const project = await this.projectsService.removeProjectEditorBoard(id, currentUser.userId);
    return {
      data: project,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:read'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Get project applications' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({
    description: 'Project applications retrieved successfully',
    type: ProjectApplicationsResponseDto,
  })
  @Get(':id/applications')
  async getProjectApplications(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryProjectApplicationsReqDto,
  ) {
    const applications = await this.projectsService.getProjectApplications(
      id,
      { search: query.search, type: query.type, status: query.status },
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: applications.applications,
      pagination: applications.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:update'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Create project application' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiCreatedResponse({
    description: 'Project application created successfully',
    type: ProjectApplicationResponseDto,
  })
  @Post(':id/applications')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'text', maxCount: 1 },
      { name: 'source', maxCount: 1 },
    ]),
  )
  async createProjectApplication(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: CreateProjectApplicationReqDto,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      text?: Express.Multer.File[];
      source?: Express.Multer.File[];
    },
  ) {
    const application = await this.projectsService.createProjectApplication(id, {
      ...data,
      userId: currentUser.userId,
      files,
    });
    return {
      data: application,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:owner', 'project:read'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Get project folders' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({
    description: 'Project folders retrieved successfully',
    type: ProjectFoldersResponseDto,
  })
  @Get(':id/folders')
  async getProjectFolders(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryProjectFoldersReqDto,
  ) {
    const folders = await this.projectsService.getProjectFolders(
      id,
      { search: query.search, parentId: query.parentId, type: query.type },
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: folders.folders,
      pagination: folders.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:folder.create', 'project:owner'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Create project folder' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiCreatedResponse({
    description: 'Project folder created successfully',
    type: ProjectFolderResponseDto,
  })
  @Post(':id/folders')
  async createProjectFolder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: CreateProjectFolderReqDto,
  ) {
    const folder = await this.projectsService.createProjectFolder(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: folder,
    };
  }


  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Get project stats' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiOkResponse({
    description: 'Project stats retrieved successfully',
    type: ProjectStatResponseDto,
  })
  @Get(':id/stats')
  async getProjectStats(@Param('id', ParseIntPipe) id: number) {
    const projectStat = await this.projectsService.getProjectStats(id);
    return {
      data: projectStat,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:update', 'project:owner'],
    resource: 'PROJECT',
  })
  @ApiOperation({ summary: 'Import project stats' })
  @ApiParam({ name: 'id', type: Number, description: 'Project id' })
  @ApiCreatedResponse({
    description: 'Project stats imported successfully',
    type: ProjectStatResponseDto,
  })
  @Post(':id/stats')
  async importProjectStats(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateProjectStatReqDto,
  ) {
    const projectStat = await this.projectsService.importProjectStats(id, data);
    return {
      data: projectStat,
    };
  }
}
