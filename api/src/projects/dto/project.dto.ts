import { IsNotEmpty, IsString } from 'class-validator';

// ChuongTV #007
export class ProjectDataRequestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
