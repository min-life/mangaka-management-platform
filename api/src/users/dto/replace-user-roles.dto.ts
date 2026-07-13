import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';

export class ReplaceUserRolesDto {
  @ApiProperty({ example: [2], type: [Number] })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds!: number[];
}
