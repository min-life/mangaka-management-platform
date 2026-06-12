import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class UpdateDisplayNameDto {
  @ApiProperty({ example: 'accountMoi', minLength: 5 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  displayName!: string;
}
