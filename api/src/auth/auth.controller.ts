import { Body, Controller, Get, Headers, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthService } from './auth.service';
import type { GoogleUser } from './interfaces';
import { Cookie } from '../share/decorators/cookie.decorator';
import { CurrentUser, Public } from '../share/decorators';
import { requireEnv } from '../share/helpers/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'none' as const,
  secure: requireEnv('NODE_ENV') === 'production',
  path: '/api/auth',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Public()
  @Post('forgot')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Public()
  @Post('reset')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return;
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @CurrentUser() googleUser: GoogleUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { redirectUrl, refreshToken, refreshTokenExpiresAt } =
      await this.authService.handleGoogleCallback(googleUser);

    if (refreshToken && refreshTokenExpiresAt) {
      response.cookie('refreshToken', refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        expires: refreshTokenExpiresAt,
      });
    }

    return response.redirect(redirectUrl);
  }

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { refreshToken, refreshTokenExpiresAt, ...loginResponse } =
      await this.authService.login(body);

    response.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      expires: refreshTokenExpiresAt,
    });

    return loginResponse;
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Cookie('refreshToken') cookieRefreshToken: string | undefined,
    @Body() body: Partial<RefreshTokenDto>,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { refreshToken, refreshTokenExpiresAt, ...refreshResponse } =
      await this.authService.refresh(cookieRefreshToken ?? body.refreshToken);

    response.cookie('refreshToken', refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      expires: refreshTokenExpiresAt,
    });

    return refreshResponse;
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Cookie('refreshToken') cookieRefreshToken: string | undefined,
    @Body() body: Partial<RefreshTokenDto>,
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(cookieRefreshToken ?? body.refreshToken, authorization);

    response.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  }
}
