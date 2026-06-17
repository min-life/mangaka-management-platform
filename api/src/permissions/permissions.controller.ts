import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionFilterDto } from './dto/permission-filter.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  findAll(@Query() query: PermissionFilterDto) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(Number(id), dto);
  }
}
