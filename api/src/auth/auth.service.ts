import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SCOPE } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR } from '../share/constants/message-error';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  requireDurationEnv,
  requireDurationStringEnv,
  requireEnv,
  requireNumberEnv,
} from '../share/helpers/env';
import type { GoogleUser } from './interfaces';

const ACCESS_TOKEN_EXPIRES_IN = requireDurationStringEnv('ACCESS_TOKEN_EXPIRES_IN');
const REFRESH_TOKEN_EXPIRES_IN = requireDurationStringEnv('REFRESH_TOKEN_EXPIRES_IN');
const REFRESH_TOKEN_EXPIRES_IN_MS = requireDurationEnv('REFRESH_TOKEN_EXPIRES_IN');
const BCRYPT_SALT_ROUNDS = requireNumberEnv('BCRYPT_SALT_ROUNDS');
const EMAIL_VERIFY_EXPIRES_IN_MS = requireDurationEnv('EMAIL_VERIFY_EXPIRES_IN');
const PASSWORD_RESET_EXPIRES_IN_MS = requireDurationEnv('PASSWORD_RESET_EXPIRES_IN');

type GoogleCallbackResult = {
  redirectUrl: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(body: RegisterDto) {
    try {
      const email = body.email.trim().toLowerCase();

      const hashedPassword = await bcrypt.hash(body.password, BCRYPT_SALT_ROUNDS);
      const emailVerifyToken = randomUUID();
      const emailVerifyExpiresAt = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_IN_MS);
      const defaultRole = await this.getSysDefaultRoleOrThrow();

      await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            displayName: body.displayName.trim(),
            isActive: false,
            emailVerifyToken,
            emailVerifyExpiresAt,
          },
        });

        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: defaultRole.id,
          },
        });
      });

      await this.mailService.sendVerifyEmail(email, this.buildVerifyEmailUrl(emailVerifyToken));

      return;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(ERROR.CFLEMAIL);
      }
      this.handleError(error, 'Register fail', ERROR.SVREGISTER);
    }
  }

  async verifyEmail(token?: string) {
    try {
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

      return;
    } catch (error) {
      this.handleError(error, 'Verify email fail', ERROR.SVREGISTER);
    }
  }

  async forgotPassword(body: ForgotPasswordDto) {
    try {
      const email = body.email.trim().toLowerCase();
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        return;
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

      return;
    } catch (error) {
      this.handleError(error, 'Forgot password fail', ERROR.SVLOGIN);
    }
  }

  async resetPassword(body: ResetPasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { passwordResetToken: body.token },
      });

      if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
        throw new BadRequestException(ERROR.EVLRESETPASSWORD);
      }

      if (user.password) {
        const isSamePassword = await bcrypt.compare(body.password, user.password);
        if (isSamePassword) {
          throw new BadRequestException(ERROR.EVLSAMEPASSWORD);
        }
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
    } catch (error) {
      this.handleError(error, 'Reset password fail', ERROR.SVLOGIN);
    }
  }

  async googleLogin(googleUser: GoogleUser) {
    try {
      const email = googleUser.email.trim().toLowerCase();
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [{ googleId: googleUser.googleId }, { email }],
        },
      });

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
        const defaultRole = await this.getSysDefaultRoleOrThrow();

        user = await this.prisma.$transaction(async (tx) => {
          const createdUser = await tx.user.create({
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

          await tx.userRole.create({
            data: {
              userId: createdUser.id,
              roleId: defaultRole.id,
            },
          });

          return createdUser;
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
    } catch (error) {
      this.handleError(error, 'Google login fail', ERROR.SVLOGIN);
    }
  }

  async handleGoogleCallback(googleUser: GoogleUser): Promise<GoogleCallbackResult> {
    try {
      const { accessToken, refreshToken, refreshTokenExpiresAt } =
        await this.googleLogin(googleUser);

      return {
        redirectUrl: this.buildFrontendUrl(
          `/auth/oauth-success?access_token=${encodeURIComponent(accessToken)}`,
        ),
        refreshToken,
        refreshTokenExpiresAt,
      };
    } catch (error) {
      this.handleError(error, 'Google OAuth callback fail', ERROR.SVLOGIN);
    }
  }

  async login(body: LoginDto) {
    try {
      const email = body.email.trim().toLowerCase();
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (!user?.password) {
        throw new UnauthorizedException(ERROR.EVLLOGIN);
      }

      if (!user.isActive) {
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
    } catch (error) {
      this.handleError(error, 'Login fail', ERROR.SVLOGIN);
    }
  }

  async refresh(refreshToken?: string) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException(ERROR.EVLREFRESHTOKEN_INVALID);
      }

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt <= new Date()) {
        if (storedToken) {
          await this.prisma.refreshToken.delete({ where: { token: refreshToken } });
        }
        throw new UnauthorizedException(ERROR.EVLREFRESHTOKEN_EXPIRED);
      }

      try {
        await this.jwtService.verifyAsync(refreshToken, {
          secret: requireEnv('REFRESH_TOKEN_SECRET'),
        });
      } catch {
        await this.prisma.refreshToken.delete({ where: { token: refreshToken } });
        throw new UnauthorizedException(ERROR.EVLLOGIN);
      }

      const accessToken = await this.signAccessToken(storedToken.user.id, storedToken.user.email);
      const nextRefresh = await this.createRefreshToken(
        storedToken.user.id,
        storedToken.user.email,
      );

      await this.prisma.refreshToken.delete({ where: { token: refreshToken } });

      return {
        accessToken,
        refreshToken: nextRefresh.refreshToken,
        refreshTokenExpiresAt: nextRefresh.refreshTokenExpiresAt,
      };
    } catch (error) {
      this.handleError(error, 'Refresh token fail', ERROR.SVLOGIN);
    }
  }

  async logout(refreshToken?: string, authorization?: string): Promise<void> {
    try {
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
    } catch (error) {
      this.handleError(error, 'Logout fail', ERROR.SVLOGOUT);
    }
  }

  private async signAccessToken(userId: number, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { userId, email, jti: randomUUID() },
      {
        secret: requireEnv('ACCESS_TOKEN_SECRET'),
        expiresIn: ACCESS_TOKEN_EXPIRES_IN as any,
      },
    );
  }

  private async createRefreshToken(userId: number, email: string) {
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);
    const refreshToken = await this.jwtService.signAsync(
      { userId, email },
      {
        secret: requireEnv('REFRESH_TOKEN_SECRET'),
        expiresIn: REFRESH_TOKEN_EXPIRES_IN as any,
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

  private async getSysDefaultRoleOrThrow() {
    const role = await this.prisma.role.findFirst({
      where: {
        scope: SCOPE.SYS,
        isDefault: true,
      },
    });

    if (!role) {
      throw new InternalServerErrorException(ERROR.SVSYSDEFAULTROLE);
    }

    return role;
  }

  private buildVerifyEmailUrl(token: string): string {
    const baseUrl = requireEnv('WEB_ORIGIN');
    return `${baseUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
  }

  private buildResetPasswordUrl(token: string): string {
    const baseUrl = requireEnv('WEB_ORIGIN');
    return `${baseUrl.replace(/\/$/, '')}/auth/forgot?token=${encodeURIComponent(token)}`;
  }

  private buildFrontendUrl(path: string): string {
    const baseUrl = requireEnv('WEB_ORIGIN');
    return `${baseUrl.replace(/\/$/, '')}${path}`;
  }

  private handleError(error: unknown, logMessage: string, clientMessage: string): never {
    this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(clientMessage);
  }
}
