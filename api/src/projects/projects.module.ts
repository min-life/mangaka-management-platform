import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { AwsS3Service } from '../share/services/aws-s3.service';

@Module({
  imports: [ActivityLogsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, AwsS3Service],
  exports: [ProjectsService],
})
export class ProjectsModule {}
