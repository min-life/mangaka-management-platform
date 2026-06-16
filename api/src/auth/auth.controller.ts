import { Body, Controller, Headers, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import { Cookie } from '../share/decorators/cookie.decorator';
import { Public } from '../share/decorators';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'none' as const,
  secure: process.env.NODE_ENV === 'production',
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
