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
  UseInterceptors,
  UploadedFiles,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser, Permissions } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { FilesService } from './files.service';
import {
  CreateMaterialReqDto,
  CreateTaskReqDto,
  FileResponseDto,
  MaterialResponseDto,
  MaterialsResponseDto,
  QueryFileTasksReqDto,
  QueryFileVersionsReqDto,
  UpdateFileReqDto,
} from './dto';
import { TaskResponseDto, TasksResponseDto } from '../tasks/dto';
import {
  CommentResponseDto,
  CommentsResponseDto,
  CreateCommentReqDto,
  QueryCommentsReqDto,
} from '../frames/dto';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'board:leader'],
    resource: 'FILE',
  })
  @ApiOperation({ summary: 'Get file comments' })
  @ApiParam({ name: 'id', type: Number, description: 'File id' })
  @ApiOkResponse({
    description: 'File comments retrieved successfully',
    type: CommentsResponseDto,
  })
  @Get(':id/comments')
  async getFileComments(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryCommentsReqDto,
  ) {
    const result = await this.filesService.getFileComments(
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
    permissions: ['project:comment.create', 'board:leader'],
    resource: 'FILE',
  })
  @ApiOperation({ summary: 'Create comment for file' })
  @ApiParam({ name: 'id', type: Number, description: 'File id' })
  @ApiCreatedResponse({ description: 'Comment created successfully', type: CommentResponseDto })
  @Post(':id/comments')
  async createComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: CreateCommentReqDto,
  ) {
    const comment = await this.filesService.createComment(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: comment,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'board:leader'],
    resource: 'FILE',
  })
  @ApiOperation({ summary: 'Get file details' })
  @ApiParam({ name: 'id', type: Number, description: 'File id' })
  @ApiOkResponse({
    description: 'File retrieved successfully',
    type: FileResponseDto,
  })
  @Get(':id')
  async getFileById(@Param('id', ParseIntPipe) id: number) {
    const file = await this.filesService.getFileById(id);
    return {
      data: file,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:file.update', 'board:leader'],
    resource: 'FILE',
  })
  @ApiOperation({ summary: 'Update file' })
  @ApiParam({ name: 'id', type: Number, description: 'File id' })
  @ApiOkResponse({ description: 'File updated successfully', type: FileResponseDto })
  @Patch(':id')
  async updateFile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateFileReqDto,
  ) {
    const file = await this.filesService.updateFile(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: file,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:file.delete', 'board:leader'],
    resource: 'FILE',
  })
  @ApiOperation({ summary: 'Delete file' })
  @ApiParam({ name: 'id', type: Number, description: 'File id' })
  @ApiOkResponse({ description: 'File deleted successfully' })
  @Delete(':id')
  async deleteFile(@Param('id', ParseIntPipe) id: number) {
    await this.filesService.deleteFile(id);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'board:leader'],
    resource: 'FILE',
  })
  @ApiOperation({ summary: 'Get file material versions' })
  @ApiParam({ name: 'id', type: Number, description: 'File id' })
  @ApiOkResponse({
    description: 'File material versions retrieved successfully',
    type: MaterialsResponseDto,
  })
  @Get(':id/versions')
  async getFileMaterialVersions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryFileVersionsReqDto,
  ) {
    const result = await this.filesService.getFileMaterialVersions(
      id,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: result.versions,
      pagination: result.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'FILE',
  })
  @ApiOperation({ summary: 'Get file materials' })
  @ApiParam({ name: 'id', type: Number, description: 'File id' })
  @ApiOkResponse({
    description: 'File materials retrieved successfully',
    type: MaterialResponseDto,
  })
  @Get(':id/materials')
  async getFileMaterials(@Param('id', ParseIntPipe) id: number) {
    const material = await this.filesService.getFileMaterials(id);
    return {
      data: material,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:material.create', 'project:owner'],
    resource: 'FILE',
  })
  @ApiOperation({ summary: 'Create material for file' })
  @ApiParam({ name: 'id', type: Number, description: 'File id' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateMaterialReqDto })
  @ApiCreatedResponse({ description: 'Material created successfully', type: MaterialResponseDto })
  @Post(':id/materials')
  @UseInterceptors(FilesInterceptor('files', 20))
  async createMaterial(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 524288000 }), // 500MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp|pdf|photoshop)$/i }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    const material = await this.filesService.createMaterial(id, {
      files,
      userId: currentUser.userId,
    });
    return {
      data: material,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'board:leader'],
    resource: 'FILE',
  })
  @ApiOperation({ summary: 'Get file tasks' })
  @ApiParam({ name: 'id', type: Number, description: 'File id' })
  @ApiOkResponse({
    description: 'File tasks retrieved successfully',
    type: TasksResponseDto,
  })
  @Get(':id/tasks')
  async getFileTasks(@Param('id', ParseIntPipe) id: number, @Query() query: QueryFileTasksReqDto) {
    const result = await this.filesService.getFileTasks(
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
    permissions: ['project:task.create', 'board:leader'],
    resource: 'FILE',
  })
  @ApiOperation({ summary: 'Create task for file' })
  @ApiParam({ name: 'id', type: Number, description: 'File id' })
  @ApiCreatedResponse({ description: 'Task created successfully', type: TaskResponseDto })
  @Post(':id/tasks')
  async createTask(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: CreateTaskReqDto,
  ) {
    const task = await this.filesService.createTask(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: task,
    };
  }
}
