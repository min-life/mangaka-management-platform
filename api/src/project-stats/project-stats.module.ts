import { Module } from '@nestjs/common';
import { ProjectStatsController } from './project-stats.controller';
import { ProjectStatsService } from './project-stats.service';

@Module({
  controllers: [ProjectStatsController],
  providers: [ProjectStatsService],
  exports: [ProjectStatsService],
})
export class ProjectStatsModule {}
