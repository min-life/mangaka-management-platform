import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMaterialQueryDto {
  @ApiPropertyOptional({ description: 'Xóa slot IMAGE', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  deleteImage?: boolean;

  @ApiPropertyOptional({ description: 'Xóa slot TEXT', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  deleteText?: boolean;

  @ApiPropertyOptional({ description: 'Xóa slot SOURCE', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  deleteSource?: boolean;
}
