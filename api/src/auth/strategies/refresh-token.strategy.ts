import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload } from '@auth/interfaces/jwt-payload.interface';

// ChuongTV #005
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: (req) => {
        const refreshToken = req.cookies['refreshToken'];
        return refreshToken;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.REFRESH_TOKEN_SECRET || 'default',
    });
  }

  async validate(payload: JwtPayload) {
    return payload;
  }
}
