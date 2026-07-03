import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateFrameReqDto {
  @ApiPropertyOptional({ example: 'Frame 1' })
  @IsOptional()
  name?: string;

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

  @ApiPropertyOptional({ example: [1, 2], type: [Number] })
  @IsOptional()
  @IsNumber({}, { each: true })
  mentionedUserIds?: number[];
}

export class CreateFrameReqDto {
  @ApiPropertyOptional({ example: 'Frame 1' })
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 15.5, type: Number })
  @Type(() => Number)
  @IsNumber()
  startX!: number;

  @ApiProperty({ example: 25.3, type: Number })
  @Type(() => Number)
  @IsNumber()
  startY!: number;

  @ApiProperty({ example: 110.7, type: Number })
  @Type(() => Number)
  @IsNumber()
  endX!: number;

  @ApiProperty({ example: 160.2, type: Number })
  @Type(() => Number)
  @IsNumber()
  endY!: number;
}

export class QueryFramesReqDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ example: 'createdAt', enum: ['createdAt'] })
  @IsOptional()
  field?: 'createdAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  order?: 'asc' | 'desc';
}
