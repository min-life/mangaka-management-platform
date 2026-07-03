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
  ApiBody,
} from '@nestjs/swagger';
import { CurrentUser, Permissions } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { MaterialsService } from './materials.service';
import { FramesService } from '../frames/frames.service';
import { 
  MaterialResponseDto, 
  UpdateMaterialQueryDto,
} from './dto';
import { CreateFrameReqDto, FrameResponseDto, FramesResponseDto, QueryFramesReqDto } from '../frames/dto';

@ApiTags('Materials')
@ApiBearerAuth()
@Controller('materials')
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
    private readonly framesService: FramesService,
  ) {}

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Get material details' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id' })
  @ApiOkResponse({
    description: 'Material retrieved successfully',
    type: MaterialResponseDto,
  })
  @Get(':id')
  async getMaterialById(@Param('id', ParseIntPipe) id: number) {
    const material = await this.materialsService.getMaterialById(id);
    return {
      data: material,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:material.update', 'project:owner'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Update material' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id' })
  @ApiOkResponse({ description: 'Material updated successfully', type: MaterialResponseDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
        text: {
          type: 'string',
          format: 'binary',
        },
        source: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'text', maxCount: 1 },
      { name: 'source', maxCount: 1 },
    ]),
  )
  @Patch(':id')
  async updateMaterial(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: UpdateMaterialQueryDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      text?: Express.Multer.File[];
      source?: Express.Multer.File[];
    } = {},
  ) {
    const material = await this.materialsService.updateMaterial(id, {
      files,
      deleteImage: query.deleteImage,
      deleteText: query.deleteText,
      deleteSource: query.deleteSource,
      userId: currentUser.userId,
    });
    return {
      data: material,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:material.delete', 'project:owner'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Delete material' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id' })
  @ApiOkResponse({ description: 'Material deleted successfully' })
  @Delete(':id')
  async deleteMaterial(@Param('id', ParseIntPipe) id: number) {
    await this.materialsService.deleteMaterial(id);
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:material.restore', 'project:owner'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Restore a material version to create a new latest version' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id (the old version to restore)' })
  @ApiOkResponse({ description: 'Material restored successfully', type: MaterialResponseDto })
  @Post(':id/restore')
  async restoreMaterial(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const material = await this.materialsService.restoreMaterial(id);
    return {
      data: material,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:read', 'project:owner'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Get material frames' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id' })
  @ApiOkResponse({ description: 'Material frames retrieved successfully', type: FramesResponseDto })
  @Get(':id/frames')
  async getMaterialFrames(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryFramesReqDto,
  ) {
    const result = await this.framesService.getMaterialFrames(
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
    permissions: ['project:frame.create', 'project:owner'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Create frame for material' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id' })
  @ApiCreatedResponse({ description: 'Frame created successfully', type: FrameResponseDto })
  @Post(':id/frames')
  async createFrame(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: CreateFrameReqDto,
  ) {
    const frame = await this.framesService.createFrame(id, {
      ...data,
      userId: currentUser.userId,
    });
    return {
      data: frame,
    };
  }
}
