'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';

import { authImages } from '@/components/auth/auth-assets';
import { AuthBackLink } from '@/components/auth/AuthBackLink';
import { AuthBrand } from '@/components/auth/AuthBrand';
import { AuthHero } from '@/components/auth/AuthHero';
import {
  authPanelClassName,
  authPrimaryButtonClassName,
} from '@/components/auth/auth-styles';
import { Button } from '@/components/ui/button';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? 'your inbox';

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#222831] text-[#eeeeee]">
      <section className={authPanelClassName}>
        <div className="mb-10">
          <AuthBackLink />
          <div className="mb-8">
            <AuthBrand />
          </div>
          <div className="mb-6 flex size-14 items-center justify-center rounded-[6px] border border-[#3B4350] bg-[#2A313C] text-[#FFD369]">
            <MailCheck className="size-7" />
          </div>
          <h2 className="mb-2 text-2xl font-bold leading-8 text-[#eeeeee]">Check your email</h2>
          <p className="text-sm leading-6 text-[#EEEEEE]">
            We sent a verification link to:
            <br />
            <span className="font-bold text-[#FFD369]">{email}</span>
          </p>
        </div>

        <div className="space-y-5">
          <div className="rounded-[4px] border border-[#3B4350] bg-[#2A313C] px-4 py-4 text-sm leading-6 text-[#EEEEEE]">
            Please verify your email before signing in. The link expires in 24 hours.
          </div>

          {process.env.NODE_ENV === 'development' ? (
            <div className="rounded-[4px] border border-[#FFD369]/30 bg-[#FFD369]/10 px-4 py-3 text-xs leading-5 text-[#f4d98a]">
              Development mode: if SMTP is not configured, check the backend console for the
              verification link.
            </div>
          ) : null}

          <Button asChild className={authPrimaryButtonClassName}>
            <Link href="/login">Back to sign in</Link>
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

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckEmailContent />
    </Suspense>
  );
}
