'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleAlert, Loader2, ShieldCheck } from 'lucide-react';

import { authImages } from '@/components/auth/auth-assets';
import { AuthBrand } from '@/components/auth/AuthBrand';
import { AuthHero } from '@/components/auth/AuthHero';
import {
  authErrorClassName,
  authPanelClassName,
  authPrimaryButtonClassName,
} from '@/components/auth/auth-styles';
import { Button } from '@/components/ui/button';
import { verifyEmail as verifyEmailRequest } from '@/services/auth.service';

type VerifyStatus = 'verifying' | 'success' | 'error';
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<VerifyStatus>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification link is missing a token.');
        return;
      }

      try {
        await verifyEmailRequest(token);
        setStatus('success');
        setMessage('Email verified successfully');
        redirectTimer = setTimeout(() => router.push('/login'), 3000);
      } catch {
        setStatus('error');
        setMessage('Verification link is invalid or expired.');
      }
    };

    verifyEmail();

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [router, token]);

  const icon =
    status === 'verifying' ? (
      <Loader2 className="size-7 animate-spin" />
    ) : status === 'success' ? (
      <ShieldCheck className="size-7" />
    ) : (
      <CircleAlert className="size-7" />
  );

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#222831] text-[#eeeeee]">
      <section className={authPanelClassName}>
        <div className="mb-10">
          <div className="mb-8">
            <AuthBrand />
          </div>
          <div
            className={`mb-6 flex size-14 items-center justify-center rounded-[6px] border bg-[#393E46] ${
              status === 'error'
                ? 'border-red-400/30 text-red-200'
                : 'border-[#4B5563] text-[#FFD369]'
            }`}
          >
            {icon}
          </div>
          <h2 className="mb-2 text-2xl font-bold leading-8 text-[#eeeeee]">
            {status === 'success'
              ? 'Email verified successfully'
              : status === 'error'
                ? 'Verification failed'
                : 'Verifying your email'}
          </h2>
          <p className="text-sm leading-6 text-[#d8dee8]">{message}</p>
        </div>

        <div className="space-y-4">
          {status === 'success' ? (
            <>
              <p className="rounded-[4px] border border-[#FFD369]/30 bg-[#FFD369]/10 px-4 py-4 text-sm leading-6 text-[#f4d98a]">
                Your account is ready. You will be redirected to sign in shortly.
              </p>
              <Button asChild className={authPrimaryButtonClassName}>
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          ) : null}

          {status === 'error' ? (
            <>
              <p className={authErrorClassName}>
                Please register again or request a fresh verification link.
              </p>
              <Button asChild className={authPrimaryButtonClassName}>
                <Link href="/register">Back to register</Link>
              </Button>
            </>
          ) : null}
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
      <VerifyEmailContent />
    </Suspense>
  );
}
