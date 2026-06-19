import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Permissions, Public } from './share/decorators';

@ApiBearerAuth()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Permissions({
    mode: 'ALL',
    permissions: ['board:leader'],
    resource: 'PROJECT',
  })
  @Get('/')
  getHello() {
    return this.appService.getHello();
  }
}
