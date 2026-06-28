import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VOTE_DECISION } from '@prisma/client';
import { UserResDto } from '../../share/dto';

export class VoteApplicationReqDto {
  @ApiProperty({ enum: VOTE_DECISION, example: VOTE_DECISION.APPROVE })
  @IsEnum(VOTE_DECISION)
  decision: VOTE_DECISION;

  @ApiProperty({ required: false, example: 'This looks good.' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ApplicationVoteResponseDto {
  @ApiProperty({ example: 1 })
  applicationId: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ enum: VOTE_DECISION, example: VOTE_DECISION.APPROVE })
  decision: VOTE_DECISION;

  @ApiProperty({ required: false, example: 'This looks good.' })
  comment?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => UserResDto })
  user: UserResDto;
}
