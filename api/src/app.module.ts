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
import { FilesModule } from './files/files.module';
import { MaterialsModule } from './materials/materials.module';
import { TasksModule } from './tasks/tasks.module';
import { FramesModule } from './frames/frames.module';
import { ProjectStatsModule } from './project-stats/project-stats.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { NotificationsModule } from './notifications/notifications.module';

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
    ApplicationsModule,
    FoldersModule,
    FilesModule,
    MaterialsModule,
    TasksModule,
    FramesModule,
    ProjectStatsModule,
    ActivityLogsModule,
    NotificationsModule,
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
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
})
export class AppModule {}
