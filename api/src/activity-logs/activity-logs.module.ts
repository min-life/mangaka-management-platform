import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsController } from './activity-logs.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, RealtimeModule],
  providers: [ActivityLogsService],
  controllers: [ActivityLogsController],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
