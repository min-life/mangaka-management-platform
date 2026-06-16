import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { ERROR } from '../../share/constants/message-error';
import { requireEnv } from '../env';

// ChuongTV #005
@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireEnv('ACCESS_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const count = await this.prisma.blacklistToken.count({
      where: {
        token: accessToken,
      },
    });

    if (count > 0) {
      throw new UnauthorizedException(ERROR.EXPTOKEN);
    }

    return payload;
  }
}
