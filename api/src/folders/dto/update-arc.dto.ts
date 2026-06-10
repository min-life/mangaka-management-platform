import { IsInt, IsOptional, IsString, Min } from 'class-validator';

// PhucTD #011 start
export class UpdateArcDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
// PhucTD #011 end
