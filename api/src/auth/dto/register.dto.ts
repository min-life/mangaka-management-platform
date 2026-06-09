import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

// KietDM #001
export class RegisterDto {
  @ApiProperty({ example: 'name@studio.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'username' })
  @IsString()
  @MinLength(5)
  display_name!: string;
}
