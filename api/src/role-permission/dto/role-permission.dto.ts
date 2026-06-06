import { ArrayNotEmpty, IsArray, IsNumberString } from 'class-validator';

export class RolePermissionDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumberString({}, { each: true })
  permissionIds!: string[];
}
