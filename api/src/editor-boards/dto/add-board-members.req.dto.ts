import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class AddBoardMembersReqDto {
  @ApiProperty({ example: [2, 3], type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  userIds!: number[];
}
