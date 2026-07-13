import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [ActivityLogsModule, RealtimeModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
