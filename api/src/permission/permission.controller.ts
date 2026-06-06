import { Controller, Get, Param, Query } from '@nestjs/common';

import { PermissionService } from './permission.service';
import { PermissionFilterDto } from './dto/permission-filter.dto';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  findAll(@Query() query: PermissionFilterDto) {
    return this.permissionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(BigInt(id));
  }
}
