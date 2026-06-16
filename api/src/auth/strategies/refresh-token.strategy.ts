import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// ChuongTV #005
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: (req) => {
        return req.cookies?.['refreshToken'];
      },
      ignoreExpiration: false,
      secretOrKey: process.env.REFRESH_TOKEN_SECRET || 'default',
    });
  }

  async validate(payload: JwtPayload) {
    return payload;
  }
}
