import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateProjectMemberReqDto {
  @ApiProperty({ example: 6, minimum: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId!: number;
}
