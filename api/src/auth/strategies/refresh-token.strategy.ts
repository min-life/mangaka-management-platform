import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { requireEnv } from '../../share/helpers/env';

// ChuongTV #005
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: (req) => {
        return req.cookies?.['refreshToken'];
      },
      ignoreExpiration: false,
      secretOrKey: requireEnv('REFRESH_TOKEN_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return payload;
  }
}
