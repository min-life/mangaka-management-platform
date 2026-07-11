import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMaterialQueryDto {
  @ApiPropertyOptional({ description: 'Tên ghi chú (commit message) cho lần cập nhật này', type: String })
  @IsOptional()
  @IsString()
  name?: string;

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
