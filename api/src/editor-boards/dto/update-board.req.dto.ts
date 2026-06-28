import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBoardReqDto {
  @ApiPropertyOptional({ example: 'Monthly Manga Review Board' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Board for weekly manga reviews', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/board.png', nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
