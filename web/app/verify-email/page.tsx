'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, CircleAlert, Loader2, ShieldCheck } from 'lucide-react';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { images } from '../register/const/studio-data';

type VerifyStatus = 'verifying' | 'success' | 'error';

// KietDM #001
export default function Page() {
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
        await api.post('/auth/verify-email', { token });
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
    <Suspense fallback={null}>
      <main className="flex min-h-screen overflow-hidden bg-[#131313] text-[#e2e2e2]">
        <section className="relative z-10 flex w-full flex-col justify-center border-r border-[#4c4546] bg-[#131313] px-6 py-12 lg:w-[480px] lg:px-12">
          <div className="mb-12">
            <div className="mb-8 flex items-center gap-3">
              <BookOpen className="size-8 text-[#c6c6c6]" />
              <h1 className="text-xl font-bold text-[#e2e2e2]">MangaStudio</h1>
            </div>
            <div className="mb-6 flex size-14 items-center justify-center rounded border border-[#4c4546] bg-[#1b1b1b] text-[#c6c6c6]">
              {icon}
            </div>
            <h2 className="mb-2 text-2xl font-semibold leading-8 text-[#e2e2e2]">
              {status === 'success'
                ? 'Email verified successfully'
                : status === 'error'
                  ? 'Verification failed'
                  : 'Verifying your email'}
            </h2>
            <p className="text-sm leading-6 text-[#cfc4c5]">{message}</p>
          </div>

          <div className="space-y-4">
            {status === 'success' ? (
              <>
                <p className="rounded border border-[#4c4546] bg-[#1b1b1b] px-4 py-4 text-sm leading-6 text-[#cfc4c5]">
                  Your account is ready. You will be redirected to sign in shortly.
                </p>
                <Button
                  asChild
                  className="h-14 w-full rounded bg-[#c6c6c6] text-xs font-bold uppercase tracking-[0.2em] text-[#303030] hover:bg-white"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            ) : null}

            {status === 'error' ? (
              <>
                <p className="rounded border border-red-400/30 bg-red-400/10 px-4 py-4 text-sm leading-6 text-red-100">
                  Please register again or request a fresh verification link.
                </p>
                <Button
                  asChild
                  className="h-14 w-full rounded bg-[#c6c6c6] text-xs font-bold uppercase tracking-[0.2em] text-[#303030] hover:bg-white"
                >
                  <Link href="/register">Back to register</Link>
                </Button>
              </>
            ) : null}
          </div>
        </section>

        <section className="relative hidden flex-1 overflow-hidden bg-[#0e0e0e] lg:block">
          <img
            alt="Professional manga production workstation"
            className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale brightness-50"
            src={images.loginHero}
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#131313] via-transparent to-transparent p-16">
            <div className="max-w-xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#c6c6c6]">
                Identity confirmed
              </p>
              <h3 className="mb-6 text-5xl font-bold leading-[56px] tracking-normal text-[#e2e2e2]">
                Your studio access
                <br />
                <span className="italic text-[#c6c6c6]">starts with trust.</span>
              </h3>
              <p className="text-base leading-6 text-[#cfc4c5]">
                Once verified, sign in to manage projects, chapters, files, and review workflows.
              </p>
            </div>
          </div>
        </section>
      </main>
    </Suspense>
  );
}
