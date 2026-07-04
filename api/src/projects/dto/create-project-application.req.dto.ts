import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APPLICATION_TYPE } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateProjectApplicationReqDto {
  @ApiProperty({ example: 'Publish request for chapter 01' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Please review before publishing.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://thumbnail.url', description: 'Folder thumbnail URL' })
  @IsOptional()
  @IsString()
  folderImageUrl?: string;

  @ApiPropertyOptional({ 
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
  @IsOptional()
  materials?: unknown;

  @ApiProperty({ enum: APPLICATION_TYPE, example: APPLICATION_TYPE.CREATE_CHAPTER })
  @IsEnum(APPLICATION_TYPE)
  type!: APPLICATION_TYPE;

  @ApiPropertyOptional({ example: 1, description: 'Parent folder ID for CREATE_CHAPTER type' })
  @IsOptional()
  @IsNumber()
  parentFolderId?: number;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Required for CREATE_ARC and CREATE_CHAPTER types',
  })
  @IsOptional()
  image?: Express.Multer.File;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Required for CREATE_ARC and CREATE_CHAPTER types',
  })
  @IsOptional()
  text?: Express.Multer.File;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional source file for CREATE_ARC and CREATE_CHAPTER types',
  })
  @IsOptional()
  source?: Express.Multer.File;
}
