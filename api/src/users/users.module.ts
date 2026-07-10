import { Module } from '@nestjs/common';
import { GoogleLinkGuard } from '../auth/guards';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [UsersController],
  providers: [UsersService, GoogleLinkGuard],
  exports: [UsersService],
})
export class UsersModule {}
