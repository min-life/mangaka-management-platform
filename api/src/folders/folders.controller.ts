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
import { FoldersService } from './folders.service';
import {
  ChildrenResponseDto,
  CreateChildFolderReqDto,
  CreateFileReqDto,
  FolderResponseDto,
  QueryFolderChildrenReqDto,
  QueryFolderFilesReqDto,
  UpdateFolderReqDto,
} from './dto';
import { FileResponseDto, FilesResponseDto } from '../files/dto';

@ApiTags('Folders')
@ApiBearerAuth()
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) { }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'FOLDER',
  })
  @ApiOperation({ summary: 'Get folder details' })
  @ApiParam({ name: 'id', type: Number, description: 'Folder id' })
  @ApiOkResponse({
    description: 'Folder retrieved successfully',
    type: FolderResponseDto,
  })
  @Get(':id')
  async getFolderById(@Param('id', ParseIntPipe) id: number) {
    const folder = await this.foldersService.getFolderById(id);
    return {
      data: folder,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:folder.update', 'project:owner'],
    resource: 'FOLDER',
  })
  @ApiOperation({ summary: 'Update folder' })
  @ApiParam({ name: 'id', type: Number, description: 'Folder id' })
  @ApiOkResponse({ description: 'Folder updated successfully', type: FolderResponseDto })
  @Patch(':id')
  async updateFolder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateFolderReqDto,
  ) {
    const folder = await this.foldersService.updateFolder(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: folder,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:folder.delete', 'project:owner'],
    resource: 'FOLDER',
  })
  @ApiOperation({ summary: 'Delete folder' })
  @ApiParam({ name: 'id', type: Number, description: 'Folder id' })
  @ApiOkResponse({ description: 'Folder deleted successfully' })
  @Delete(':id')
  async deleteFolder(@Param('id', ParseIntPipe) id: number) {
    await this.foldersService.deleteFolder(id);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'FOLDER',
  })
  @ApiOperation({ summary: 'Get folder files' })
  @ApiParam({ name: 'id', type: Number, description: 'Folder id' })
  @ApiOkResponse({
    description: 'Folder files retrieved successfully',
    type: FilesResponseDto,
  })
  @Get(':id/files')
  async getFolderFiles(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryFolderFilesReqDto,
  ) {
    const result = await this.foldersService.getFolderFiles(
      id,
      { search: query.search },
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: result.files,
      pagination: result.pagination,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:file.create', 'project:owner'],
    resource: 'FOLDER',
  })
  @ApiOperation({ summary: 'Create file in folder' })
  @ApiParam({ name: 'id', type: Number, description: 'Folder id' })
  @ApiCreatedResponse({ description: 'File created successfully', type: FileResponseDto })
  @Post(':id/files')
  async createFile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: CreateFileReqDto,
  ) {
    const file = await this.foldersService.createFile(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: file,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'FOLDER',
  })
  @ApiOperation({ summary: 'Get folder children' })
  @ApiParam({ name: 'id', type: Number, description: 'Folder id' })
  @ApiOkResponse({
    description: 'Folder children retrieved successfully',
    type: ChildrenResponseDto,
  })
  @Get(':id/children')
  async getFolderChildren(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryFolderChildrenReqDto,
  ) {
    const result = await this.foldersService.getFolderChildren(
      id,
      { search: query.search },
      query.field && query.order ? { field: query.field, order: query.order } : undefined,
      query.page && query.limit ? { page: query.page, limit: query.limit } : undefined,
    );
    return {
      data: result.folders,
      pagination: result.pagination,
    };
  }
}
