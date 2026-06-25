import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APPLICATION_TYPE } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectApplicationReqDto {
  @ApiProperty({ example: 'Publish request for chapter 01' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Please review before publishing.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: [{ fileId: 1, page: 1 }] })
  @IsNotEmpty()
  materials!: unknown;

  @ApiProperty({ enum: APPLICATION_TYPE, example: APPLICATION_TYPE.PUBLISH_REQUEST })
  @IsEnum(APPLICATION_TYPE)
  type!: APPLICATION_TYPE;
}
