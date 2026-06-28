import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: number) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        include: {
          activityLog: {
            include: {
              actor: {
                select: { id: true, displayName: true, email: true, avatarUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { data: notifications };
    } catch (error) {
      this.logger.error('Get notifications fail', error);
      throw new InternalServerErrorException('Get notifications fail');
    }
  }
}
