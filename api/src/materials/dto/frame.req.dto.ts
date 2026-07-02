import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFrameReqDto {
  @ApiProperty({ example: 10.5, type: Number })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  startX!: number;

  @ApiProperty({ example: 20.3, type: Number })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  startY!: number;

  @ApiProperty({ example: 100.7, type: Number })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  endX!: number;

  @ApiProperty({ example: 150.2, type: Number })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  endY!: number;
}
