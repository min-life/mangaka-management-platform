import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { APPLICATION_STATUS, APPLICATION_TYPE } from '@prisma/client';
import { UserResDto } from '../../share/dto';
import { ProjectBasicResDto, ProjectResDto } from '../../projects/dto';

export class PaginationResDto {
  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class ApplicationResDto {
  @ApiProperty({ example: 7 })
  id!: number;

  @ApiProperty({ type: ProjectBasicResDto })
  project!: ProjectBasicResDto;

  @ApiProperty({ example: 'Publish request for chapter 01' })
  title!: string;

  @ApiPropertyOptional({ example: 'Please review before publishing.', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ example: [{ fileId: 1, page: 1 }], nullable: true })
  materials?: unknown | null;

  @ApiProperty({ enum: APPLICATION_TYPE, example: APPLICATION_TYPE.PUBLISH_REQUEST })
  type!: APPLICATION_TYPE;

  @ApiProperty({ enum: APPLICATION_STATUS, example: APPLICATION_STATUS.PENDING })
  status!: APPLICATION_STATUS;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  verifiedByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  createdByUser?: UserResDto | null;

  @ApiPropertyOptional({ type: UserResDto, nullable: true })
  updatedByUser?: UserResDto | null;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-18T03:00:00.000Z' })
  updatedAt!: Date;
}

export class ApplicationResponseDto {
  @ApiProperty({ type: ApplicationResDto })
  data!: ApplicationResDto;
}

export class ApplicationsResponseDto {
  @ApiProperty({ type: [ApplicationResDto] })
  data!: ApplicationResDto[];

  @ApiProperty({ type: PaginationResDto })
  pagination!: PaginationResDto;
}
