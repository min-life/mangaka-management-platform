import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class UploadProjectStatReqDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  file: any;

  @ApiProperty({ description: 'The Chapter ID to link this stat to' })
  @Type(() => Number)
  @IsNumber()
  chapterId!: number;
}

export class QueryProjectStatReqDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  arcId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chapterId?: number;
}

export class ProjectStatSummaryDto {
  @ApiProperty({ example: 15000 })
  totalViews!: number;

  @ApiProperty({ example: 300 })
  totalSales!: number;

  @ApiProperty({ example: 4500.5 })
  totalRevenue!: number;

  @ApiProperty({ example: 150 })
  totalReviews!: number;

  @ApiProperty({ example: 4.39 })
  averageRating!: number;
}

export class ProjectStatMonthDto {
  @ApiProperty({ example: 1 })
  month!: number;

  @ApiProperty({ example: 5000 })
  views!: number;

  @ApiProperty({ example: 100 })
  sales!: number;

  @ApiProperty({ example: 1500 })
  revenue!: number;

  @ApiProperty({ example: 50 })
  reviews!: number;

  @ApiProperty({ example: 4.2 })
  rating!: number;
}

export class ProjectStatResDto {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ type: ProjectStatSummaryDto })
  summary!: ProjectStatSummaryDto;

  @ApiProperty({ type: [ProjectStatMonthDto] })
  months!: ProjectStatMonthDto[];
}

export class ProjectStatResponseDto {
  @ApiProperty({ type: ProjectStatResDto })
  data!: ProjectStatResDto;
}
