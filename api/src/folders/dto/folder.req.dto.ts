import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateFolderReqDto {
  @ApiPropertyOptional({ example: 'Updated folder title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateFileReqDto {
  @ApiProperty({ example: 'Chapter 01 Page 1' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'First page of chapter 01.' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateChildFolderReqDto {
  @ApiProperty({ example: 'Sub-folder' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Child folder description.' })
  @IsOptional()
  @IsString()
  description?: string;
}
