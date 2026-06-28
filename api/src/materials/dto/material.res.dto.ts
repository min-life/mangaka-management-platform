import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResDto } from '../../share/dto';

export class MaterialResDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 5 })
  fileId!: number;

  @ApiProperty({
    example: { layers: ['background', 'characters'], colors: ['#FF0000', '#00FF00'] },
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
