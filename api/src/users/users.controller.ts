import { Body, Controller, Patch } from '@nestjs/common';
import { CurrentUser } from '@auth/decorators';
import type { JwtPayload } from '@auth/interfaces';
import { UpdateDisplayNameDto } from './dto/update-display-name.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me/display-name')
  updateDisplayName(@CurrentUser() currentUser: JwtPayload, @Body() body: UpdateDisplayNameDto) {
    return this.usersService.updateCurrentUserDisplayName(
      Number(currentUser.userId),
      body.displayName,
    );
  }
}
