import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class UpdateProjectReqDto {
  @ApiPropertyOptional({ example: 'One-shot Chapter 02' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 1, nullable: true, minimum: 1, type: Number })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Transform(({ value }) => (value === null ? null : Number(value)))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  editorBoardId?: number | null;
}
