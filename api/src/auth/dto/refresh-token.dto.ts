import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

// KietDM #001
export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
