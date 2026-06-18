import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
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
    permissions: ['project:read', 'board:leader'],
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
    permissions: ['project:material.update', 'board:leader'],
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
    permissions: ['project:material.delete', 'board:leader'],
    resource: 'MATERIAL',
  })
  @ApiOperation({ summary: 'Delete material' })
  @ApiParam({ name: 'id', type: Number, description: 'Material id' })
  @ApiOkResponse({ description: 'Material deleted successfully' })
  @Delete(':id')
  async deleteMaterial(@Param('id', ParseIntPipe) id: number) {
    await this.materialsService.deleteMaterial(id);
  }
}
