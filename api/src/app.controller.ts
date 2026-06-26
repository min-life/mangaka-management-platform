import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Permissions, Public } from './share/decorators';

@ApiTags('App')
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
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiOkResponse({ description: 'API is running' })
  @Get('/')
  getHello() {
    return this.appService.getHello();
  }
}
