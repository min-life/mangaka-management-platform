import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// ChuongTV #005
export const CurrentUser = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);