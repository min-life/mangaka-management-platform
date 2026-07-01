import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryActivityLogsReqDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by file ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fileId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by project ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  projectId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by editor board ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  editorBoardId?: number;
}
