import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@auth/auth.module';
import { GlobalAuthGuard } from '@auth/guards';
import { PermissionModule } from './permission/permission.module';
import { RolesModule } from './roles/roles.module';

import { AccessTokenStrategy, RefreshTokenStrategy } from '@auth/strategies';

@Module({
  imports: [PrismaModule, PermissionModule, RolesModule, AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
})
export class AppModule {}
