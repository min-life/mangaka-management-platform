import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ERROR } from '../share/constants/message-error';

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 7);
const REFRESH_TOKEN_EXPIRES_IN_MS = REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(body: RegisterDto) {
    const email = body.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException(ERROR.CFLEMAIL);
    }

    const hashedPassword = await bcrypt.hash(body.password, BCRYPT_SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName: body.displayName.trim(),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    return {
      user,
    };
  }

  async login(body: LoginDto) {
    const email = body.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user?.password) {
      throw new UnauthorizedException(ERROR.EVLLOGIN);
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR.EVLLOGIN);
    }

    const accessToken = await this.signAccessToken(user.id, user.email);
    const { refreshToken, refreshTokenExpiresAt } = await this.createRefreshToken(
      user.id,
      user.email,
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException(ERROR.EVLLOGIN);
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt <= new Date()) {
      if (storedToken) {
        await this.prisma.refreshToken.delete({ where: { token: refreshToken } });
      }
      throw new UnauthorizedException(ERROR.EVLLOGIN);
    }

    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET ?? 'default',
      });
    } catch {
      await this.prisma.refreshToken.delete({ where: { token: refreshToken } });
      throw new UnauthorizedException(ERROR.EVLLOGIN);
    }

    const accessToken = await this.signAccessToken(storedToken.user.id, storedToken.user.email);
    const nextRefresh = await this.createRefreshToken(storedToken.user.id, storedToken.user.email);

    await this.prisma.refreshToken.delete({ where: { token: refreshToken } });

    return {
      accessToken,
      refreshToken: nextRefresh.refreshToken,
      refreshTokenExpiresAt: nextRefresh.refreshTokenExpiresAt,
    };
  }

  async logout(refreshToken?: string, authorization?: string): Promise<void> {
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (accessToken) {
      const payload = this.jwtService.decode(accessToken) as { exp?: number } | null;
      if (payload?.exp) {
        await this.prisma.blacklistToken.upsert({
          where: { token: accessToken },
          update: { expiresAt: new Date(payload.exp * 1000) },
          create: {
            token: accessToken,
            expiresAt: new Date(payload.exp * 1000),
          },
        });
      }
    }

    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
  }

  private async signAccessToken(userId: number, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { userId, email, jti: randomUUID() },
      {
        secret: process.env.ACCESS_TOKEN_SECRET || 'default',
        expiresIn: ACCESS_TOKEN_EXPIRES_IN as any,
      },
    );
  }

  private async createRefreshToken(userId: number, email: string) {
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);
    const refreshToken = await this.jwtService.signAsync(
      { userId, email },
      {
        secret: process.env.REFRESH_TOKEN_SECRET ?? 'default',
        expiresIn: `${REFRESH_TOKEN_EXPIRES_IN_DAYS}d` as any,
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return { refreshToken, refreshTokenExpiresAt };
  }
}
