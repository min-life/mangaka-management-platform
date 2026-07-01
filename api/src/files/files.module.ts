import { Module } from '@nestjs/common';
import { AwsS3Service } from '../share/services/aws-s3.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [ActivityLogsModule, RealtimeModule],
  controllers: [FilesController],
  providers: [FilesService, AwsS3Service],
  exports: [FilesService],
})
export class FilesModule {}
