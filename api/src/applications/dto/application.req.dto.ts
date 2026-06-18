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

  @ApiPropertyOptional({ example: [{ fileId: 1, page: 2 }] })
  @IsOptional()
  materials?: unknown;
}

export class UpdateApplicationStatusReqDto {
  @ApiProperty({ enum: APPLICATION_STATUS, example: APPLICATION_STATUS.APPROVE })
  @IsEnum(APPLICATION_STATUS)
  status!: APPLICATION_STATUS;
}
