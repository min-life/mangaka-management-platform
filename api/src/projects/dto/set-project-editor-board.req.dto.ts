import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SetProjectEditorBoardReqDto {
  @ApiProperty({ example: 1, minimum: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  editorBoardId!: number;
}
