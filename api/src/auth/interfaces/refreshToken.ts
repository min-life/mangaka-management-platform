import { Request } from 'express';

export type RefreshRequest = Request & {
  user: {
    userId: string | bigint;
    email: string;
  };
};
