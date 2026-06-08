import { SCOPE } from '@prisma/client';

export class PermissionResponseDto {
  id!: string; // bigint converted to string
  name!: string;
  scope!: SCOPE;
  description?: string;
  status?: string;
}
