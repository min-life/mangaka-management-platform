import { IsInt, IsOptional, IsString, Min } from 'class-validator';

// PhucTD #011 start
export class CreateChapterDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
// PhucTD #011 end
