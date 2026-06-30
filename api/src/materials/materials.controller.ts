import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  ParseIntPipe, 
  Patch, 
  Post, 
  UseInterceptors, 
  UploadedFiles,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { MaterialsService } from './materials.service';
import { MaterialResponseDto, UpdateMaterialReqDto } from './dto';

@ApiTags('Materials')
@ApiBearerAuth()
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

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
  @Patch(':id')
  async updateMaterial(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
    @Body() data: UpdateMaterialReqDto,
  ) {
    const material = await this.materialsService.updateMaterial(id, {
      ...data,
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
    permissions: ['project:material.create', 'project:owner'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Restore a material version to create a new latest version' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id (the old version to restore)' })
  @ApiCreatedResponse({ description: 'Material restored successfully', type: MaterialResponseDto })
  @Post(':id/restore')
  async restoreMaterial(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const material = await this.materialsService.restoreMaterial(id, currentUser.userId);
    return {
      data: material,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:material.update', 'project:owner'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Add files to an existing material version (creates a new version)' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Material updated successfully', type: MaterialResponseDto })
  @Post(':id/add')
  @UseInterceptors(FilesInterceptor('files', 20))
  async addMaterialItems(
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
    const material = await this.materialsService.addMaterialItems(id, currentUser.userId, files);
    return {
      data: material,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:material.update', 'project:owner'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Delete a file item from a material (creates a new version)' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id' })
  @ApiParam({ name: 'index', type: Number, description: 'Index of the item to delete' })
  @ApiOkResponse({ description: 'Material updated successfully', type: MaterialResponseDto })
  @Delete(':id/delete/:index')
  async deleteMaterialItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('index', ParseIntPipe) index: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const material = await this.materialsService.deleteMaterialItem(id, currentUser.userId, index);
    return {
      data: material,
    };
  }

  @Permissions({
    mode: 'ANY',
    permissions: ['project:material.update', 'project:owner'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Set a file item as thumbnail (creates a new version)' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id' })
  @ApiParam({ name: 'index', type: Number, description: 'Index of the item to set as thumbnail' })
  @ApiOkResponse({ description: 'Material updated successfully', type: MaterialResponseDto })
  @Patch(':id/thumbnail/:index')
  async setMaterialThumbnail(
    @Param('id', ParseIntPipe) id: number,
    @Param('index', ParseIntPipe) index: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const material = await this.materialsService.setMaterialThumbnail(id, currentUser.userId, index);
    return {
      data: material,
    };
  }
}
