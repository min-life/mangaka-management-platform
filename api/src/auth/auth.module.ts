import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MailService } from '../mail/mail.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [AuthController],
  providers: [AuthService, MailService, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
