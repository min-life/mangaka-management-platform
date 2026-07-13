import { ApiProperty } from '@nestjs/swagger';
import {
  EditorBoardResDto,
  BoardMemberResDto,
  BoardProjectResDto,
  BoardApplicationResDto,
} from './editor-board.res.dto';

export class EditorBoardDashboardStatsDto {
  @ApiProperty({ example: 10 })
  totalProjects!: number;

  @ApiProperty({ example: 5 })
  activeMembers!: number;

  @ApiProperty({ example: 2 })
  pendingApprovals!: number;

  @ApiProperty({ example: 15 })
  approvedThisMonth!: number;
}

export class EditorBoardDashboardDataDto {
  @ApiProperty({ type: EditorBoardResDto })
  board!: EditorBoardResDto;

  @ApiProperty({ type: EditorBoardDashboardStatsDto })
  stats!: EditorBoardDashboardStatsDto;

  @ApiProperty({ type: [BoardMemberResDto] })
  members!: BoardMemberResDto[];

  @ApiProperty({ type: [BoardProjectResDto] })
  projects!: BoardProjectResDto[];

  @ApiProperty({ type: [BoardApplicationResDto] })
  applications!: BoardApplicationResDto[];
}

export class EditorBoardDashboardResponseDto {
  @ApiProperty({ type: EditorBoardDashboardDataDto })
  data!: EditorBoardDashboardDataDto;
}
