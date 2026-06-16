import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { UpdateDisplayNameDto } from './dto/update-display-name.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() currentUser: JwtPayload) {
    return this.usersService.getMe(currentUser.userId);
  }

  @Patch('me')
  updateDisplayName(@CurrentUser() currentUser: JwtPayload, @Body() body: UpdateDisplayNameDto) {
    return this.usersService.updateCurrentUserDisplayName(currentUser.userId, body.displayName);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@CurrentUser() currentUser: JwtPayload, @Body() body: any) {
    return this.usersService.create({ ...body, createdBy: currentUser.userId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  @Patch(':id')
  update(@CurrentUser() currentUser: JwtPayload, @Param('id') id: string, @Body() body: any) {
    return this.usersService.update(Number(id), { ...body, updatedBy: currentUser.userId });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.delete(Number(id));
  }

  @Put(':userId/roles/:roleId')
  assignRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.usersService.assignRole(Number(userId), Number(roleId));
  }

  @Delete(':userId/roles/:roleId')
  removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(Number(userId), Number(roleId));
  }
}
