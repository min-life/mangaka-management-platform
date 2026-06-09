import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestWithCookieHeader = {
  headers: {
    cookie?: string;
  };
};

export const Cookie = createParamDecorator(
  (cookieName: string, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithCookieHeader>();
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, ...valueParts] = cookie.trim().split('=');

        if (!key) {
          return acc;
        }

        const value = valueParts.join('=');

        try {
          acc[key] = decodeURIComponent(value);
        } catch {
          acc[key] = value;
        }

        return acc;
      },
      {} as Record<string, string>,
    );

    return cookies[cookieName];
  },
);
