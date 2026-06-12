// KietDM #001
export interface GoogleOAuthProfile {
  provider: 'google';
  providerAccountId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
}
