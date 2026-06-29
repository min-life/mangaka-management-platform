import { Controller, Get, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({ status: 200, description: 'Return list of notifications' })
  @Get()
  async getNotifications(@CurrentUser() currentUser: JwtPayload) {
    return this.notificationsService.getNotifications(currentUser.userId);
  }

  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Return updated notification' })
  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: JwtPayload) {
    return this.notificationsService.markAsRead(id, currentUser.userId);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'Return success status' })
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() currentUser: JwtPayload) {
    return this.notificationsService.markAllAsRead(currentUser.userId);
  }
}
