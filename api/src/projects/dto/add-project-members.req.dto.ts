import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class AddProjectMembersReqDto {
  @ApiProperty({ example: [2, 3], type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  userIds!: number[];

  @ApiProperty({ example: 5, minimum: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId!: number;
}
