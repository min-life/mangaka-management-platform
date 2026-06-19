import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt } from 'class-validator';

export class AppendUserRolesDto {
  @ApiProperty({ example: [2], type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  roleIds!: number[];
}
