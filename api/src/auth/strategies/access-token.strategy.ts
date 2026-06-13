import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload } from '@auth/interfaces/jwt-payload.interface';
import { PrismaService } from '@/prisma/prisma.service';
import { ERROR } from '@/constants/message-error';

// ChuongTV #005
@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ACCESS_TOKEN_SECRET || 'default',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const accessToken = req.headers.authorization.split()[1];
    const count = await this.prisma.blacklistToken.count({
      where: {
        token: accessToken,
      },
    });

    return count > 0 ? new UnauthorizedException(ERROR.EXPTOKEN) : payload;
  }
}
