import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBoardReqDto {
  @ApiPropertyOptional({ example: 'Monthly Manga Review Board' })
  @IsOptional()
  @IsString()
  name?: string;
}
