import { Controller, Get, Param, Query } from '@nestjs/common';

import { PermissionsService } from './permissions.service';
import { PermissionFilterDto } from './dto/permission-filter.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}
  //AnhNTT #003 start

  @Get()
  findAll(@Query() query: PermissionFilterDto) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(BigInt(id));
  }
  //AnhNTT #003 end
}
