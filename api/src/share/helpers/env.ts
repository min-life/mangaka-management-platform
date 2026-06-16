import { InternalServerErrorException } from '@nestjs/common';
import ms from 'ms';
import { ERROR } from '../constants/message-error';

export function requireEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new InternalServerErrorException(ERROR.SVENV);
  }

  return value;
}

export function requireNumberEnv(key: string): number {
  const value = Number(requireEnv(key));

  if (Number.isNaN(value)) {
    throw new InternalServerErrorException(ERROR.SVENV);
  }

  return value;
}

export function requireDurationEnv(key: string): number {
  const value = ms(requireEnv(key) as ms.StringValue);

  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new InternalServerErrorException(ERROR.SVENV);
  }

  return value;
}

export function requireDurationStringEnv(key: string): string {
  const value = requireEnv(key);
  requireDurationEnv(key);
  return value;
}
