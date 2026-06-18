import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Permissions } from '../share/decorators';
import { PermissionsService } from './permissions.service';
import { PermissionFilterDto } from './dto/permission-filter.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions({ mode: 'ANY', permissions: ['admin', 'permission:read'] })
  findAll(@Query() query: PermissionFilterDto) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'permission:read'] })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(Number(id));
  }

  @Patch(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'permission:update'] })
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(Number(id), dto);
  }
}
