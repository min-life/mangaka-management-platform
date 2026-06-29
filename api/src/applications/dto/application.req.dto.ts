import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APPLICATION_STATUS } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateApplicationReqDto {
  @ApiPropertyOptional({ example: 'Updated title for application' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

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
}

export class UpdateApplicationStatusReqDto {
  @ApiProperty({ enum: APPLICATION_STATUS, example: APPLICATION_STATUS.APPROVE })
  @IsEnum(APPLICATION_STATUS)
  status!: APPLICATION_STATUS;
}

export class ApplicationMaterialReqDto {
  @ApiProperty({ 
    example: {
      url: 'https://...',
      originalName: 'image.png',
      size: 1024,
      mimeType: 'image/png',
      width: 1920,
      height: 1080,
      ratio: 1.77,
      isThumbnail: true,
    }
  })
  materialItem!: any;
}
