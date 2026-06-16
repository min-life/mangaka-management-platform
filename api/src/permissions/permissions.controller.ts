import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionFilterDto } from './dto/permission-filter.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  findAll(@Query() query: PermissionFilterDto) {
    return this.permissionsService.findAll(query);
  }

  @Post()
  create(@Body() body: any) {
    return this.permissionsService.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.permissionsService.update(Number(id), body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.permissionsService.delete(Number(id));
  }
}
