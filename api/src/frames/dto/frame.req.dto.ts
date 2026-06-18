import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateFrameReqDto {
  @ApiPropertyOptional({ example: 15.5, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  startX?: number;

  @ApiPropertyOptional({ example: 25.3, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  startY?: number;

  @ApiPropertyOptional({ example: 110.7, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  endX?: number;

  @ApiPropertyOptional({ example: 160.2, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  endY?: number;
}

export class CreateCommentReqDto {
  @ApiProperty({ example: { text: 'Review this area' } })
  @IsNotEmpty()
  content!: unknown;
}
