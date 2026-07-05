import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { GoogleLinkGuard } from '../auth/guards';
import type { GoogleUser, JwtPayload } from '../auth/interfaces';
import { CurrentUser, Permissions, Public } from '../share/decorators';
import { AppendUserRolesDto } from './dto/append-user-roles.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { ReplaceUserRolesDto } from './dto/replace-user-roles.dto';
import { CreatePasswordDto } from './dto/create-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersReqDto, UsersResponseDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'User profile retrieved successfully' })
  @Get('me')
  getMe(@CurrentUser() currentUser: JwtPayload) {
    return this.usersService.getMe(currentUser.userId);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ description: 'Profile updated successfully' })
  @Patch('me')
  updateMe(@CurrentUser() currentUser: JwtPayload, @Body() body: UpdateProfileDto) {
    return this.usersService.updateMe(currentUser.userId, body);
  }

  @ApiOperation({ summary: 'Update current user password' })
  @ApiOkResponse({ description: 'Password updated successfully' })
  @Patch('me/password')
  async updatePassword(
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: UpdatePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.usersService.updatePassword(currentUser.userId, body);
    if (!result) return;

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: result.refreshTokenExpiresAt,
    });

    return { data: { accessToken: result.accessToken } };
  }

  @ApiOperation({ summary: 'Check if current user has password' })
  @ApiOkResponse({ description: 'Returns boolean indicating if user has password' })
  @Get('me/has-password')
  hasPassword(@CurrentUser() currentUser: JwtPayload) {
    return this.usersService.hasPassword(currentUser.userId);
  }

  @ApiOperation({ summary: 'Create new password for current user' })
  @ApiOkResponse({ description: 'Password created successfully' })
  @Post('me/password')
  async createPassword(
    @CurrentUser() currentUser: JwtPayload,
    @Body() body: CreatePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.usersService.createPassword(currentUser.userId, body);
    if (!result) return;

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: result.refreshTokenExpiresAt,
    });

    return { data: { accessToken: result.accessToken } };
  }

  @ApiOperation({ summary: 'Initiate Google account linking' })
  @ApiOkResponse({ description: 'Redirects to Google OAuth' })
  @Get('me/link-account')
  @UseGuards(GoogleLinkGuard)
  linkGoogleAccount() {
    return;
  }

  @Public()
  @ApiOperation({ summary: 'Google account linking callback' })
  @ApiOkResponse({ description: 'Account linked successfully' })
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

  @ApiOperation({ summary: 'Get user statistics (admin only)' })
  @ApiOkResponse({ description: 'Statistics retrieved successfully' })
  @Get('stats')
  @Permissions({ mode: 'ANY', permissions: ['admin'] })
  getStats() {
    return this.usersService.getStats();
  }

  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiOkResponse({ description: 'Users retrieved successfully', type: UsersResponseDto })
  @Get()
  findAll(@Query() query: QueryUsersReqDto) {
    const { search, isActive, field, order, page, limit } = query;
    return this.usersService.findAll(
      { search, isActive },
      { field, order },
      { page: page ?? 1, limit: limit ?? 10 },
    );
  }

  @ApiOperation({ summary: 'Create staff user (admin only)' })
  @ApiCreatedResponse({ description: 'User created successfully' })
  @Post()
  @Permissions({ mode: 'ANY', permissions: ['admin'] })
  create(@CurrentUser() currentUser: JwtPayload, @Body() body: CreateStaffUserDto) {
    return this.usersService.createStaffUser(currentUser.userId, body);
  }

  @ApiOperation({ summary: 'Get user roles' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'User roles retrieved successfully' })
  @Get(':userId/roles')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  findRoles(@Param('userId') userId: string) {
    return this.usersService.findRoles(Number(userId));
  }

  @ApiOperation({ summary: 'Append roles to user' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'Roles appended successfully' })
  @Post(':userId/roles')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  appendRoles(@Param('userId') userId: string, @Body() body: AppendUserRolesDto) {
    return this.usersService.appendRoles(Number(userId), body.roleIds);
  }

  @ApiOperation({ summary: 'Replace user roles' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'Roles replaced successfully' })
  @Put(':userId/roles')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'role:read'] })
  replaceRoles(@Param('userId') userId: string, @Body() body: ReplaceUserRolesDto) {
    return this.usersService.replaceRoles(Number(userId), body.roleIds);
  }

  @ApiOperation({ summary: 'Get user projects' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'User projects retrieved successfully' })
  @Get(':userId/projects')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'project:read'] })
  findProjects(@Param('userId') userId: string) {
    return this.usersService.findProjects(Number(userId));
  }

  @ApiOperation({ summary: 'Get user editor boards' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'User editor boards retrieved successfully' })
  @Get(':userId/editor-boards')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'project:read'] })
  findEditorBoards(@Param('userId') userId: string) {
    return this.usersService.findEditorBoards(Number(userId));
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'User retrieved successfully' })
  @Get(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'user:read'] })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'User updated successfully' })
  @Patch(':id')
  @Permissions({ mode: 'ANY', permissions: ['admin', 'user:update'] })
  update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(Number(id), { ...body, updatedBy: currentUser.userId });
  }

  @ApiOperation({ summary: 'Force reset user password (admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  @Post(':id/force-reset-password')
  @Permissions({ mode: 'ANY', permissions: ['admin'] })
  forceResetPassword(@Param('id') id: string) {
    return this.usersService.forceResetPassword(Number(id));
  }
}
