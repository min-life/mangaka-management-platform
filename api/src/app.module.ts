import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@auth/auth.module';
import { GlobalAuthGuard } from '@auth/guards';
import { AccessTokenStrategy, RefreshTokenStrategy } from '@auth/strategies';
import { FoldersModule } from './folders/folders.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [PrismaModule, AuthModule, FoldersModule, FilesModule],
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
