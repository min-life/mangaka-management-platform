import { Controller, Get, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { NotificationsService } from './notifications.service';
import { NotificationsResponseDto, NotificationResponseDto } from './dto';
import { SuccessResponseDto } from '../projects/dto/project.res.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiOkResponse({ description: 'Return list of notifications', type: NotificationsResponseDto })
  @Get()
  async getNotifications(@CurrentUser() currentUser: JwtPayload) {
    return this.notificationsService.getNotifications(currentUser.userId);
  }

  @ApiOperation({ summary: 'Get unread notification count' })
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() currentUser: JwtPayload) {
    return this.notificationsService.getUnreadCount(currentUser.userId);
  }

  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiOkResponse({ description: 'Return updated notification', type: NotificationResponseDto })
  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: JwtPayload) {
    return this.notificationsService.markAsRead(id, currentUser.userId);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({ description: 'Return success status', type: SuccessResponseDto })
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() currentUser: JwtPayload) {
    return this.notificationsService.markAllAsRead(currentUser.userId);
  }
}
