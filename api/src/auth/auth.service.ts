import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { GoogleUser } from './interfaces';

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 7);
const REFRESH_TOKEN_EXPIRES_IN_MS = REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
const EMAIL_VERIFY_EXPIRES_IN_HOURS = Number(process.env.EMAIL_VERIFY_EXPIRES_IN_HOURS ?? 24);
const EMAIL_VERIFY_EXPIRES_IN_MS = EMAIL_VERIFY_EXPIRES_IN_HOURS * 60 * 60 * 1000;
const PASSWORD_RESET_EXPIRES_IN_HOURS = Number(process.env.PASSWORD_RESET_EXPIRES_IN_HOURS ?? 24);
const PASSWORD_RESET_EXPIRES_IN_MS = PASSWORD_RESET_EXPIRES_IN_HOURS * 60 * 60 * 1000;

export class OAuthEmailExistsError extends Error {}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(body: RegisterDto) {
    const email = body.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException(ERROR.CFLEMAIL);
    }

    const hashedPassword = await bcrypt.hash(body.password, BCRYPT_SALT_ROUNDS);
    const emailVerifyToken = randomUUID();
    const emailVerifyExpiresAt = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_IN_MS);

    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName: body.displayName.trim(),
        isActive: false,
        emailVerifyToken,
        emailVerifyExpiresAt,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    await this.mailService.sendVerifyEmail(email, this.buildVerifyEmailUrl(emailVerifyToken));

    return;
  }

  async verifyEmail(token?: string) {
    if (!token) {
      throw new BadRequestException(ERROR.EVLVERIFYEMAIL);
    }

    const user = await this.prisma.user.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!user || !user.emailVerifyExpiresAt || user.emailVerifyExpiresAt <= new Date()) {
      throw new BadRequestException(ERROR.EVLVERIFYEMAIL);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
      },
    });

    return { data: { success: true } };
  }

  async forgotPassword(body: ForgotPasswordDto) {
    const email = body.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException(ERROR.NFUSER);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(ERROR.EVLACTIVE);
    }

    const passwordResetToken = randomUUID();
    const passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_IN_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiresAt,
      },
    });

    await this.mailService.sendResetPasswordEmail(
      email,
      this.buildResetPasswordUrl(passwordResetToken),
    );

    return { data: { success: true } };
  }

  async resetPassword(body: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: body.token },
    });

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
      throw new BadRequestException(ERROR.EVLRESETPASSWORD);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: await bcrypt.hash(body.password, BCRYPT_SALT_ROUNDS),
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return { data: { success: true } };
  }

  async googleLogin(googleUser: GoogleUser) {
    const email = googleUser.email.trim().toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.googleId }, { email }],
      },
    });

    if (user?.password && !user.googleId) {
      throw new OAuthEmailExistsError();
    }

    if (user && !user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          isActive: true,
          avatarUrl: googleUser.avatarUrl ?? user.avatarUrl,
          displayName: user.displayName ?? googleUser.displayName,
        },
      });
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          displayName: googleUser.displayName,
          avatarUrl: googleUser.avatarUrl,
          googleId: googleUser.googleId,
          password: null,
          isActive: true,
          emailVerifyToken: null,
          emailVerifyExpiresAt: null,
        },
      });
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

  async login(body: LoginDto) {
    const email = body.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user?.password) {
      throw new UnauthorizedException(ERROR.EVLLOGIN);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(ERROR.EVLACTIVE);
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

  private buildVerifyEmailUrl(token: string): string {
    const baseUrl =
      process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3000}/api`;
    return `${baseUrl.replace(/\/$/, '')}/auth/verify-email?token=${encodeURIComponent(token)}`;
  }

  private buildResetPasswordUrl(token: string): string {
    const baseUrl = process.env.WEB_ORIGIN ?? 'http://localhost:3001';
    return `${baseUrl.replace(/\/$/, '')}/auth/forgot?token=${encodeURIComponent(token)}`;
  }
}
