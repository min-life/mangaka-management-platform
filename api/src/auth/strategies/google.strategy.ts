import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleOAuthProfile } from '@auth/interfaces';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'missing-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing-google-client-secret',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const primaryEmail = profile.emails?.[0];
    const googleProfile: GoogleOAuthProfile = {
      provider: 'google',
      providerAccountId: profile.id,
      email: primaryEmail?.value?.trim().toLowerCase() ?? '',
      displayName: profile.displayName || primaryEmail?.value || 'Google User',
      avatarUrl: profile.photos?.[0]?.value,
      emailVerified: primaryEmail?.verified === true,
    };

    done(null, googleProfile);
  }
}
