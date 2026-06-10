import { IsInt, IsOptional, IsString, Min } from 'class-validator';

// PhucTD #011 start
export class CreateArcDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;

  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
// PhucTD #011 end
