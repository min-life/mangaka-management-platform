import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

// KietDM #001
export class VerifyEmailDto {
  @ApiProperty({ example: '9f1b2c3d4e5f...' })
  @IsString()
  @MinLength(1)
  token!: string;
}
