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

  getAuthenticateOptions() {
    return {
      callbackURL: this.getLinkCallbackUrl(),
    };
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
