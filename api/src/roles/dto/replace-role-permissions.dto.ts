import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';

export class ReplaceRolePermissionsDto {
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((permissionId) => Number(permissionId)) : value,
  )
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  permissionIds!: number[];
}
