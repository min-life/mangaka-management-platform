import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token?.split(' ')[1] || client.handshake.auth?.token;
      if (!token) {
        throw new Error('No token provided');
      }

      // Verify token
      const payload = this.jwtService.verify(token);

      // Check blacklist
      const count = await this.prisma.blacklistToken.count({
        where: { token },
      });
      if (count > 0) {
        throw new Error('Token is blacklisted');
      }

      // Join personal room for notifications
      const userId = payload.userId;
      client.data.userId = userId;
      client.join(`user_${userId}`);
      
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Connection failed for client ${client.id}: ${error instanceof Error ? error.message : String(error)}`);
      client.emit('auth_error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('project:subscribe')
  async handleProjectSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: number },
  ) {
    if (data?.projectId) {
      const room = `project_${data.projectId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined ${room}`);
    }
  }

  @SubscribeMessage('project:unsubscribe')
  async handleProjectUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: number },
  ) {
    if (data?.projectId) {
      const room = `project_${data.projectId}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} left ${room}`);
    }
  }

  @SubscribeMessage('comment:subscribe')
  async handleCommentSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { entityType: string; entityId: number },
  ) {
    if (data?.entityType && data?.entityId) {
      const room = `${data.entityType.toLowerCase()}_comments_${data.entityId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined ${room}`);
    }
  }

  @SubscribeMessage('comment:unsubscribe')
  async handleCommentUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { entityType: string; entityId: number },
  ) {
    if (data?.entityType && data?.entityId) {
      const room = `${data.entityType.toLowerCase()}_comments_${data.entityId}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} left ${room}`);
    }
  }

  // --- Utility methods to emit events from other services ---

  broadcastActivity(projectId: number | null, editorBoardId: number | null, activityData: any) {
    if (projectId) {
      this.server.to(`project_${projectId}`).emit('activity:new', activityData);
    }
    // Optional: emit to board room if needed
    if (editorBoardId) {
      this.server.to(`board_${editorBoardId}`).emit('activity:new', activityData);
    }
  }

  notifyUser(userId: number, notificationData: any) {
    this.server.to(`user_${userId}`).emit('notification:new', notificationData);
  }

  broadcastComment(entityType: string, entityId: number, eventName: 'comment:new' | 'comment:updated' | 'comment:deleted', data: any) {
    const room = `${entityType.toLowerCase()}_comments_${entityId}`;
    this.server.to(room).emit(eventName, data);
  }
}
