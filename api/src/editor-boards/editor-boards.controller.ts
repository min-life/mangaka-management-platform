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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { EditorBoardsService } from './editor-boards.service';
import { CurrentUser, Permissions } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import {
  AddBoardMembersReqDto,
  AddBoardProjectsResponseDto,
  AddBoardProjectsReqDto,
  BoardApplicationsResponseDto,
  BoardMemberResponseDto,
  BoardMembersResponseDto,
  BoardProjectsResponseDto,
  CreateBoardReqDto,
  EditorBoardResponseDto,
  EditorBoardsResponseDto,
  QueryBoardApplicationsReqDto,
  QueryBoardMembersReqDto,
  QueryBoardProjectsReqDto,
  QueryBoardsReqDto,
  UpdateBoardReqDto,
} from './dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { QueryActivityLogsReqDto } from '../activity-logs/dto';
@ApiTags('Editor Boards')
@ApiBearerAuth()
@Controller('editor-boards')
export class EditorBoardsController {
  constructor(
    private readonly editorBoardsService: EditorBoardsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @ApiOperation({ summary: 'Create editor board' })
  @ApiCreatedResponse({
    description: 'Editor board created successfully',
    type: EditorBoardResponseDto,
  })
  @Post()
  async createEditorBoard(@CurrentUser() currentUser: JwtPayload, @Body() data: CreateBoardReqDto) {
    const board = await this.editorBoardsService.createEditorBoard({
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: board,
    };
  }

  @ApiOperation({ summary: 'Get editor boards' })
  @ApiOkResponse({
    description: 'Editor boards retrieved successfully',
    type: EditorBoardsResponseDto,
  })
  @Get()
  async getEditorBoards(@CurrentUser() currentUser: JwtPayload, @Query() query: QueryBoardsReqDto) {
    const filter = {
      name: query.name,
      me: query.me,
    };

    const sort =
      query.field && query.order ? { field: query.field, order: query.order } : undefined;
    const pagination =
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined;

    const result = await this.editorBoardsService.getEditorBoards(
      currentUser.userId,
      filter,
      sort,
      pagination,
    );
    return {
      data: result.boards,
      pagination: result.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:leader', 'board:member', 'board:owner'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Get editor board details' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiOkResponse({
    description: 'Editor board retrieved successfully',
    type: EditorBoardResponseDto,
  })
  @Get(':id')
  async getBoardDetails(@Param('id', ParseIntPipe) id: number) {
    const board = await this.editorBoardsService.getBoardById(id);
    return {
      data: board,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:owner'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Delete editor board' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiOkResponse({ description: 'Editor board deleted successfully' })
  @Delete(':id')
  async deleteBoard(@Param('id', ParseIntPipe) id: number) {
    await this.editorBoardsService.deleteBoard(id);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:owner'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Update editor board' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiOkResponse({
    description: 'Editor board updated successfully',
    type: EditorBoardResponseDto,
  })
  @Patch(':id')
  async updateBoard(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateBoardReqDto,
  ) {
    const board = await this.editorBoardsService.updateBoard(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: board,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:owner'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Add members to editor board' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiCreatedResponse({ description: 'Members added successfully' })
  @Post(':id/members')
  async addMembersToBoard(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AddBoardMembersReqDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    await this.editorBoardsService.addMembersToBoard(id, data.userIds, currentUser.userId);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:owner', 'board:leader', 'board:member'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Get editor board members' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiOkResponse({
    description: 'Editor board members retrieved successfully',
    type: BoardMembersResponseDto,
  })
  @Get(':id/members')
  async getBoardMembers(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryBoardMembersReqDto,
  ) {
    const members = await this.editorBoardsService.getBoardMembers(
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
    permissions: ['board:owner', 'board:leader', 'board:member'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Get editor board member details' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiParam({ name: 'userId', type: Number, description: 'User id' })
  @ApiOkResponse({
    description: 'Editor board member retrieved successfully',
    type: BoardMemberResponseDto,
  })
  @Get(':id/members/:userId')
  async getBoardMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const member = await this.editorBoardsService.getBoardMember(id, userId);
    return {
      data: member,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:owner'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Remove member from editor board' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiParam({ name: 'userId', type: Number, description: 'User id' })
  @ApiOkResponse({ description: 'Member removed successfully' })
  @Delete(':id/members/:userId')
  async removeBoardMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    await this.editorBoardsService.removeBoardMember(id, userId, currentUser.userId);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:leader', 'board:member', 'board:owner'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Leave editor board' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiOkResponse({ description: 'Successfully left the board' })
  @Delete(':id/members/me')
  async leaveBoard(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: JwtPayload) {
    await this.editorBoardsService.leaveBoard(id, currentUser.userId);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:owner'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Set editor board member as lead' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiParam({ name: 'userId', type: Number, description: 'User id' })
  @ApiOkResponse({
    description: 'Editor board member updated successfully',
    type: BoardMemberResponseDto,
  })
  @Patch(':id/members/:userId/lead')
  async updateBoardMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const member = await this.editorBoardsService.setToLead(id, userId);
    return {
      data: member,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:owner', 'board:leader', 'board:member'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Get editor board projects' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiOkResponse({
    description: 'Editor board projects retrieved successfully',
    type: BoardProjectsResponseDto,
  })
  @Get(':id/projects')
  async getBoardProjects(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryBoardProjectsReqDto,
  ) {
    const projects = await this.editorBoardsService.getBoardProjects(
      id,
      query.search ? { search: query.search } : undefined,
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: projects.projects,
      pagination: projects.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:owner', 'board:leader'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Add projects to editor board' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiOkResponse({
    description: 'Projects added successfully',
    type: AddBoardProjectsResponseDto,
  })
  @Post(':id/projects')
  async addProjectsToBoard(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AddBoardProjectsReqDto,
  ) {
    const projects = await this.editorBoardsService.addProjectsToBoard(id, data.projectIds);
    return {
      data: projects,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['board:owner', 'board:leader', 'board:member'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Get editor board applications' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiOkResponse({
    description: 'Editor board applications retrieved successfully',
    type: BoardApplicationsResponseDto,
  })
  @Get(':id/applications')
  async getBoardApplications(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryBoardApplicationsReqDto,
  ) {
    const applications = await this.editorBoardsService.getBoardApplications(
      id,
      query.search ? { search: query.search } : undefined,
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
    permissions: ['board:leader', 'board:member', 'board:owner'],
    resource: 'BOARD',
  })
  @ApiOperation({ summary: 'Get activity logs for an editor board' })
  @ApiParam({ name: 'id', type: Number, description: 'Editor board id' })
  @ApiOkResponse({ description: 'Editor board activity logs retrieved successfully' })
  @Get(':id/activity-logs')
  async getBoardActivityLogs(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryActivityLogsReqDto,
  ) {
    return await this.activityLogsService.getActivityLogs({
      ...query,
      editorBoardId: id,
    });
  }
}
