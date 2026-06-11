import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@auth/auth.module';
import { GlobalAuthGuard, PermissionGuard } from '@auth/guards';
import { AccessTokenStrategy, RefreshTokenStrategy } from '@auth/strategies';
import { FoldersModule } from './folders/folders.module';
import { FilesModule } from './files/files.module';
import { UsersModule } from '@users/users.module';
import { RolesModule } from '@roles/roles.module';
import { PermissionsModule } from '@permissions/permissions.module';
import { ProjectsModule } from './projects/projects.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    JwtModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CompaniesModule,
    ProjectsModule,
    FoldersModule,
    FilesModule,
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
