import { BadRequestException } from '@nestjs/common';

export function parseBigIntParam(value: string, paramName: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException(`${paramName} must be a numeric string`);
  }

  return BigInt(value);
}
