import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../share/decorators';
import type { JwtPayload } from '../auth/interfaces';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Get current user notifications' })
  @Get()
  async getNotifications(@CurrentUser() currentUser: JwtPayload) {
    return this.notificationsService.getNotifications(currentUser.userId);
  }
}
