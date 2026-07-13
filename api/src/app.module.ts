import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AccessTokenStrategy, RefreshTokenStrategy } from './auth/strategies';
import { GlobalAuthGuard, PermissionGuard } from './auth/guards';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ProjectsModule } from './projects/projects.module';
import { EditorBoardsModule } from './editor-boards/editor-boards.module';
import { ApplicationsModule } from './applications/applications.module';
import { FoldersModule } from './folders/folders.module';
import { CommentsModule } from './comments/comments.module';
import { FilesModule } from './files/files.module';
import { MaterialsModule } from './materials/materials.module';
import { TasksModule } from './tasks/tasks.module';
import { FramesModule } from './frames/frames.module';
import { ProjectStatsModule } from './project-stats/project-stats.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RedisModule } from './redis/redis.module';
import { AwsS3Module } from './share/services/aws-s3.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PresignUrlInterceptor } from './share/interceptors/presign-url.interceptor';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EventEmitterModule.forRoot(),
    JwtModule.register({
      global: true,
    }),
    UsersModule,
    RolesModule,
    PermissionsModule,
    ProjectsModule,
    EditorBoardsModule,
    CommentsModule,
    ApplicationsModule,
    FoldersModule,
    FilesModule,
    MaterialsModule,
    TasksModule,
    FramesModule,
    ProjectStatsModule,
    ActivityLogsModule,
    NotificationsModule,
    RealtimeModule,
    RedisModule,
    AwsS3Module,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PresignUrlInterceptor,
    },
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
})
export class AppModule {}
