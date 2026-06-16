import { Module } from '@nestjs/common';
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
// import { ResourcesModule } from './resources/resources.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    JwtModule.register({
      global: true,
    }),
    UsersModule,
    RolesModule,
    PermissionsModule,
    ProjectsModule,
    // ResourcesModule,
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
