import { Body, Controller, Get, Headers, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
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
  secure: true, // SameSite=None requires Secure=true even on localhost
  path: '/api/auth',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  @ApiConflictResponse({ description: 'Email already exists' })
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @ApiOperation({ summary: 'Verify user email' })
  @ApiOkResponse({ description: 'Email verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid, expired, or already used verify email token' })
  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Public()
  @ApiOperation({ summary: 'Request password reset' })
  @ApiOkResponse({ description: 'Password reset email sent if email exists' })
  @Post('forgot')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Public()
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid token or new password cannot be the same as old password',
  })
  @Post('reset')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Public()
  @ApiOperation({ summary: 'Get Google OAuth URL for Login' })
  @ApiOkResponse({ description: 'Returns Google OAuth URL' })
  @Get('google')
  googleAuth() {
    return this.authService.getGoogleAuthUrl();
  }

  @Public()
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiOkResponse({ description: 'Authentication successful' })
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
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Login successful' })
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
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ description: 'Token refreshed successfully' })
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
  @ApiOperation({ summary: 'Logout user' })
  @ApiOkResponse({ description: 'Logout successful' })
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
