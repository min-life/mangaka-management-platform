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
import { CurrentUser, Permissions } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { TasksService } from './tasks.service';
import { QueryFileVersionsReqDto } from '../files/dto/query-file-versions.req.dto';
import { MaterialsResponseDto } from '../files/dto/file.res.dto';
import {
  QueryMyTasksReqDto,
  QueryTasksReqDto,
  TaskResponseDto,
  TasksResponseDto,
  UpdateTaskReqDto,
} from './dto';

import { CommentResponseDto, CommentsResponseDto, CreateCommentReqDto, QueryCommentsReqDto, FramesResponseDto, QueryFramesReqDto } from '../frames/dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'TASK',
  })
  @ApiOperation({ summary: 'Get task comments' })
  @ApiParam({ name: 'id', type: Number, description: 'Task id' })
  @ApiOkResponse({
    description: 'Task comments retrieved successfully',
    type: CommentsResponseDto,
  })
  @Get(':id/comments')
  async getTaskComments(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryCommentsReqDto,
  ) {
    const result = await this.tasksService.getTaskComments(
      id,
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: result.comments,
      pagination: result.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'TASK',
  })
  @ApiOperation({ summary: 'Get task frames' })
  @ApiParam({ name: 'id', type: Number, description: 'Task id' })
  @ApiOkResponse({
    description: 'Task frames retrieved successfully',
    type: FramesResponseDto,
  })
  @Get(':id/frames')
  async getTaskFrames(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryFramesReqDto,
  ) {
    const result = await this.tasksService.getTaskFrames(
      id,
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: result.frames,
      pagination: result.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:comment.create', 'project:owner'],
    resource: 'TASK',
  })
  @ApiOperation({ summary: 'Create comment for task' })
  @ApiParam({ name: 'id', type: Number, description: 'Task id' })
  @ApiCreatedResponse({ description: 'Comment created successfully', type: CommentResponseDto })
  @Post(':id/comments')
  async createComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: CreateCommentReqDto,
  ) {
    const comment = await this.tasksService.createComment(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: comment,
    };
  }

  @ApiOperation({ summary: 'Get all tasks of current user across all projects' })
  @ApiOkResponse({
    description: 'User tasks retrieved successfully',
    type: TasksResponseDto,
  })
  @Get()
  async getMyTasks(@CurrentUser() currentUser: JwtPayload, @Query() query: QueryMyTasksReqDto) {
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
    const result = await this.tasksService.getMyTasks(
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
    permissions: ['project:read', 'project:owner'],
    resource: 'TASK',
  })
  @ApiOperation({ summary: 'Get task details' })
  @ApiParam({ name: 'id', type: Number, description: 'Task id' })
  @ApiOkResponse({
    description: 'Task retrieved successfully',
    type: TaskResponseDto,
  })
  @Get(':id')
  async getTaskById(@Param('id', ParseIntPipe) id: number) {
    const task = await this.tasksService.getTaskById(id);
    return {
      data: task,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:task.update', 'project:owner'],
    resource: 'TASK',
  })
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'id', type: Number, description: 'Task id' })
  @ApiOkResponse({ description: 'Task updated successfully', type: TaskResponseDto })
  @Patch(':id')
  async updateTask(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateTaskReqDto,
  ) {
    const task = await this.tasksService.updateTask(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: task,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:task.delete', 'project:owner'],
    resource: 'TASK',
  })
  @ApiOperation({ summary: 'Delete task' })
  @ApiParam({ name: 'id', type: Number, description: 'Task id' })
  @ApiOkResponse({ description: 'Task deleted successfully' })
  @Delete(':id')
  async deleteTask(@Param('id', ParseIntPipe) id: number) {
    await this.tasksService.deleteTask(id);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'TASK',
  })
  @ApiOperation({ summary: 'Get task children' })
  @ApiParam({ name: 'id', type: Number, description: 'Task id' })
  @ApiOkResponse({
    description: 'Task children retrieved successfully',
    type: TasksResponseDto,
  })
  @Get(':id/children')
  async getTaskChildren(@Param('id', ParseIntPipe) id: number, @Query() query: QueryTasksReqDto) {
    const result = await this.tasksService.getTaskChildren(
      id,
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
    permissions: ['project:read', 'project:owner'],
    resource: 'TASK',
  })
  @ApiOperation({ summary: 'Get task materials' })
  @ApiParam({ name: 'id', type: Number, description: 'Task id' })
  @ApiOkResponse({ 
    description: 'Task materials retrieved successfully',
    type: MaterialsResponseDto,
  })
  @Get(':id/materials')
  async getTaskMaterials(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryFileVersionsReqDto,
  ) {
    const result = await this.tasksService.getTaskMaterials(
      id,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return result;
  }

}
