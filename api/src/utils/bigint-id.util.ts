import { BadRequestException } from '@nestjs/common';

const BIGINT_ID_PATTERN = /^[1-9]\d*$/;

// #011
export function toBigIntId(value: string, fieldName: string): bigint {
  if (!BIGINT_ID_PATTERN.test(value)) {
    throw new BadRequestException(`${fieldName} must be a valid BigInt string`);
  }

  try {
    return BigInt(value);
  } catch {
    throw new BadRequestException(`${fieldName} must be a valid BigInt string`);
  }
}

// #011
export function toOptionalBigIntId(value: string | undefined, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  return toBigIntId(value, fieldName);
}
