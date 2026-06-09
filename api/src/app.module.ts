import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@auth/auth.module';
import { GlobalAuthGuard } from '@auth/guards';
import { AccessTokenStrategy, GoogleStrategy, RefreshTokenStrategy } from '@auth/strategies';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
    AccessTokenStrategy,
    RefreshTokenStrategy,
    GoogleStrategy,
  ],
})
export class AppModule {}
