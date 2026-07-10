import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: number, query?: { page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const [total, data] = await Promise.all([
        this.prisma.notification.count({ where: { userId } }),
        this.prisma.notification.findMany({
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
          skip,
          take: limit,
        }),
      ]);

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Get notifications fail', error);
      throw new InternalServerErrorException('Get notifications fail');
    }
  }
  async markAsRead(id: number, userId: number) {
    try {
      const notification = await this.prisma.notification.findUnique({ where: { id } });
      if (!notification || notification.userId !== userId) {
        throw new InternalServerErrorException('Notification not found');
      }

      const updated = await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return { data: updated };
    } catch (error) {
      this.logger.error('Mark notification as read fail', error);
      throw new InternalServerErrorException('Mark notification as read fail');
    }
  }

  async markAllAsRead(userId: number) {
    try {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Mark all notifications as read fail', error);
      throw new InternalServerErrorException('Mark all notifications as read fail');
    }
  }
  async getUnreadCount(userId: number) {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });
      return { count };
    } catch (error) {
      this.logger.error('Get unread notifications count fail', error);
      throw new InternalServerErrorException('Get unread notifications count fail');
    }
  }
}
