'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CircleAlert } from 'lucide-react';

import { authImages } from '@/components/auth/auth-assets';
import { AuthBackLink } from '@/components/auth/AuthBackLink';
import { AuthBrand } from '@/components/auth/AuthBrand';
import { AuthHero } from '@/components/auth/AuthHero';
import { authErrorClassName, authPrimaryButtonClassName, authPanelClassName } from '@/components/auth/auth-styles';
import { Button } from '@/components/ui/button';

const REASON_MESSAGES: Record<string, string> = {
  email_mismatch: "The Google account's email doesn't match your account's email.",
  google_account_already_linked: 'This Google account is already linked to another user.',
  invalid_google_account: 'The Google sign-in link expired or was invalid. Please try again.',
  invalid_state: 'The Google sign-in link expired or was invalid. Please try again.',
};

const DEFAULT_MESSAGE = 'Unable to link your Google account. Please try again.';

function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const message = (reason && REASON_MESSAGES[reason]) || DEFAULT_MESSAGE;

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#222831] text-[#eeeeee]">
      <section className={authPanelClassName}>
        <div className="mb-10">
          <AuthBackLink />
          <div className="mb-8">
            <AuthBrand />
          </div>
          <div className="mb-6 flex size-14 items-center justify-center rounded-[6px] border border-red-400/30 bg-[#393E46] text-red-200">
            <CircleAlert className="size-7" />
          </div>
          <h2 className="mb-2 text-2xl font-bold leading-8 text-[#eeeeee]">
            Unable to link Google account
          </h2>
          <p className="text-sm leading-6 text-[#d8dee8]">{message}</p>
        </div>

        <div className="space-y-4">
          <p className={authErrorClassName}>Please try again from your profile page.</p>
          <Button asChild className={authPrimaryButtonClassName}>
            <Link href="/user-profile">Back to profile</Link>
          </Button>
        </div>
      </section>

      <AuthHero
        description="Bring storyboards, files, tasks, and reviews into one focused workspace built for manga teams moving from draft pages to publication."
        image={authImages.hero}
        title={
          <>
            Manage every chapter, <br />
            <span className="italic text-[#FFD369]">from sketch to release.</span>
          </>
        }
      />
    </main>
  );
}

export default function OAuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <OAuthErrorContent />
    </Suspense>
  );
}
