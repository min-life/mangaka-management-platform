import { Module } from '@nestjs/common';
import { EditorBoardsService } from './editor-boards.service';
import { EditorBoardsController } from './editor-boards.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [EditorBoardsController],
  providers: [EditorBoardsService],
})
export class EditorBoardsModule {}
