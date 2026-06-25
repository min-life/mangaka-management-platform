import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBoardReqDto {
  @ApiProperty({ example: 'Weekly Manga Review Board' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
