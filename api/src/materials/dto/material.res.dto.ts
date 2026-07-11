import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResDto } from '../../share/dto';

export class SimpleMaterialResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 5 })
  fileId!: number;
}

export class MaterialResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 5 })
  fileId!: number;

  @ApiProperty({
    example: [
      {
        url: 'https://...',
        downloadUrl: 'https://...',
        originalName: 'image.png',
        size: 1024,
        mimeType: 'image/png',
        type: 'IMAGE',
        width: 1920,
        height: 1080,
        ratio: 1.77,
        isThumbnail: true,
      },
      {
        url: 'https://...',
        downloadUrl: 'https://...',
        originalName: 'document.pdf',
        size: 2048,
        mimeType: 'application/pdf',
        type: 'TEXT',
      },
      {
        url: 'https://...',
        downloadUrl: 'https://...',
        originalName: 'source.zip',
        size: 4096,
        mimeType: 'application/zip',
        type: 'SOURCE',
      },
    ],
  })
  materials!: unknown;

  @ApiPropertyOptional({ type: () => UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: () => UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class MaterialResponseDto {
  @ApiProperty({ type: MaterialResDto })
  data!: MaterialResDto;
}
