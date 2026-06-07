import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class RolePermissionDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds!: string[];
}
