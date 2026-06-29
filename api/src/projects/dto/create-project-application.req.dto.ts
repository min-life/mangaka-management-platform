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

  @ApiProperty({ 
    example: [
      {
        url: 'https://...',
        originalName: 'image.png',
        size: 1024,
        mimeType: 'image/png',
        width: 1920,
        height: 1080,
        ratio: 1.77,
        isThumbnail: true,
      }
    ] 
  })
  @IsNotEmpty()
  materials!: unknown;

  @ApiProperty({ enum: APPLICATION_TYPE, example: APPLICATION_TYPE.PUBLISH_REQUEST })
  @IsEnum(APPLICATION_TYPE)
  type!: APPLICATION_TYPE;
}
