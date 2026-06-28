import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoardReqDto {
  @ApiProperty({ example: 'Weekly Manga Review Board' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Board for weekly manga reviews', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/board.png', nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
