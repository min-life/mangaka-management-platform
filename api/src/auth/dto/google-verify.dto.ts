import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleVerifyDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZ...',
    description: 'Google ID token received from the native SDK',
  })
  @IsNotEmpty()
  @IsString()
  idToken!: string;
}
