import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentReqDto {
  @ApiPropertyOptional({ example: 'Updated comment content' })
  @IsOptional()
  @IsString()
  content?: string;
}
