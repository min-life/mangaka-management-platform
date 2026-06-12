import {
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthService } from './auth.service';
import { Cookie } from '../common/decorators/cookie.decorator';
import { Public } from './decorators';
import { GoogleOAuthProfile } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // KietDM #001
  @Public()
  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { refreshToken, refreshTokenExpiresAt, ...loginResponse } =
      await this.authService.login(body);

    //Lưu refresh token vào cookie Start
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      expires: refreshTokenExpiresAt,
      path: '/api/auth',
    });
    //Lưu refresh token vào cookie End

    return loginResponse;
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    return;
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() request: Request & { user: GoogleOAuthProfile },
    @Res() response: Response,
  ) {
    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3001').replace(/\/$/, '');

    try {
      const { accessToken, refreshToken, refreshTokenExpiresAt, requiresProfileCompletion } =
        await this.authService.loginWithGoogle(request.user);

      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: process.env.NODE_ENV === 'production',
        expires: refreshTokenExpiresAt,
        path: '/api/auth',
      });

      const redirectUrl = new URL('/auth/oauth-success', frontendUrl);
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set(
        'next',
        requiresProfileCompletion ? '/complete-profile' : '/studio',
      );

      return response.redirect(redirectUrl.toString());
    } catch (error) {
      const redirectUrl = new URL('/login', frontendUrl);
      redirectUrl.searchParams.set(
        'error',
        error instanceof ConflictException ? 'oauth_email_exists' : 'oauth_failed',
      );

      return response.redirect(redirectUrl.toString());
    }
  }

  // KietDM #001
  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Cookie('refreshToken') refreshToken: string | undefined,
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(refreshToken, authorization);

    response.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth',
    });
  }

  // KietDM #001
  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { user } = await this.authService.register(body);
    return {
      user: {
        ...user,
        id: user.id.toString(),
      },
    };
  }

  // KietDM #001
  @Public()
  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body);
  }

  // KietDM #001
}
