import { Module } from '@nestjs/common';
import { EditorBoardsService } from './editor-boards.service';
import { EditorBoardsController } from './editor-boards.controller';

@Module({
  controllers: [EditorBoardsController],
  providers: [EditorBoardsService],
})
export class EditorBoardsModule {}
