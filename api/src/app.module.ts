import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { CompaniesModule } from './companies/companies.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from '@auth/auth.module';
import { GlobalAuthGuard } from '@auth/guards';
import { PermissionGuard } from '@auth/guards/permission.guard';
import { AccessTokenStrategy, RefreshTokenStrategy } from '@auth/strategies';
import { UsersModule } from '@users/users.module';
import { PermissionsModule } from '@permissions/permissions.module';

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
