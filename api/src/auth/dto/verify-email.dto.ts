import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'f4e67d5b-5c5f-4ff7-9952-58dc2a7d51af' })
  @IsString()
  token!: string;
}
