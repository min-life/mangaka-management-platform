import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GoogleLinkGuard } from '../auth/guards';
import type { GoogleUser, JwtPayload } from '../auth/interfaces';
import { CurrentUser, Permissions, Public } from '../share/decorators';
import { AppendUserRolesDto } from './dto/append-user-roles.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { ReplaceUserRolesDto } from './dto/replace-user-roles.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() currentUser: JwtPayload) {
    return this.usersService.getMe(currentUser.userId);
  }

  @Patch('me')
  updateMe(@CurrentUser() currentUser: JwtPayload, @Body() body: UpdateProfileDto) {
    return this.usersService.updateMe(currentUser.userId, body);
  }

  @Patch('me/password')
  updatePassword(@CurrentUser() currentUser: JwtPayload, @Body() body: UpdatePasswordDto) {
    return this.usersService.updatePassword(currentUser.userId, body);
  }

  @Get('me/link-account')
  @UseGuards(GoogleLinkGuard)
  linkGoogleAccount() {
    return;
  }

  @Public()
  @Get('me/link-account/callback')
  @UseGuards(GoogleLinkGuard)
  async linkGoogleAccountCallback(
    @CurrentUser() googleUser: GoogleUser,
    @Query('state') state: string | undefined,
    @Res() response: Response,
  ) {
    const redirectUrl = await this.usersService.linkGoogleAccount(state, googleUser);
    return response.redirect(redirectUrl);
  }

  @Get()
  @Permissions({ mode: 'ANY', permissions: ['admin', 'user:read'] })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @Permissions({ mode: 'ANY', permissions: ['admin'] })
  create(@CurrentUser() currentUser: JwtPayload, @Body() body: CreateStaffUserDto) {
    return this.usersService.createStaffUser(currentUser.userId, body);
  }

  @Get(':userId/roles')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  findRoles(@Param('userId') userId: string) {
    return this.usersService.findRoles(Number(userId));
  }

  @Post(':userId/roles')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  appendRoles(@Param('userId') userId: string, @Body() body: AppendUserRolesDto) {
    return this.usersService.appendRoles(Number(userId), body.roleIds);
  }

  @Put(':userId/roles')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  replaceRoles(@Param('userId') userId: string, @Body() body: ReplaceUserRolesDto) {
    return this.usersService.replaceRoles(Number(userId), body.roleIds);
  }

  @Get(':userId/projects')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'project:read'] })
  findProjects(@Param('userId') userId: string) {
    return this.usersService.findProjects(Number(userId));
  }

  @Get(':userId/editor-boards')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'project:read'] })
  findEditorBoards(@Param('userId') userId: string) {
    return this.usersService.findEditorBoards(Number(userId));
  }

  @Get(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'user:read'] })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  @Patch(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'user:update'] })
  update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(Number(id), { ...body, updatedBy: currentUser.userId });
  }

  @Delete(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'user:delete'] })
  delete(@Param('id') id: string) {
    return this.usersService.delete(Number(id));
  }
}
