import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompaniesModule } from './companies/companies.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from '@auth/auth.module';
import { AccessTokenStrategy, GoogleStrategy, RefreshTokenStrategy } from '@auth/strategies';
import { GlobalAuthGuard, PermissionGuard } from '@auth/guards';
import { UsersModule } from '@users/users.module';
import { RolesModule } from '@roles/roles.module';
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
    GoogleStrategy,
  ],
})
export class AppModule {}
