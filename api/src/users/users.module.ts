import { Module } from '@nestjs/common';
import { GoogleLinkGuard } from '../auth/guards';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, GoogleLinkGuard],
  exports: [UsersService],
})
export class UsersModule {}
