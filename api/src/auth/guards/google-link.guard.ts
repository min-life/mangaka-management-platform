import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../interfaces';
import { requireEnv } from '../../share/helpers/env';

@Injectable()
export class GoogleLinkGuard extends AuthGuard('google') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const options: { callbackURL: string; state?: string } = {
      callbackURL: this.getLinkCallbackUrl(),
    };

    if (!request.path?.endsWith('/callback')) {
      const currentUser = request.user as JwtPayload | undefined;
      options.state = this.jwtService.sign(
        { userId: currentUser?.userId },
        {
          secret: requireEnv('ACCESS_TOKEN_SECRET'),
          expiresIn: '10m',
        },
      );
    }

    return options;
  }

  private getLinkCallbackUrl() {
    return (
      process.env.GOOGLE_LINK_CALLBACK_URL ??
      requireEnv('GOOGLE_CALLBACK_URL').replace(
        /\/auth\/google\/callback$/,
        '/users/me/link-account/callback',
      )
    );
  }
}
