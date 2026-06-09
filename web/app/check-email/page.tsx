'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { images } from '../register/const/studio-data';


// KietDM #001
export default function Page() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? 'your inbox';
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
              <MailCheck className="size-7" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold leading-8 text-[#e2e2e2]">
              Check your email
            </h2>
            <p className="text-sm leading-6 text-[#cfc4c5]">
              We sent a verification link to:
              <br />
              <span className="font-semibold text-[#e2e2e2]">{email}</span>
            </p>
          </div>

          <div className="space-y-5">
            <div className="rounded border border-[#4c4546] bg-[#1b1b1b] px-4 py-4 text-sm leading-6 text-[#cfc4c5]">
              Please verify your email before signing in. The link expires in 24 hours.
            </div>

            {process.env.NODE_ENV === 'development' ? (
              <p className="text-xs leading-5 text-[#988e90]">
                Development mode: if SMTP is not configured, check the backend console for the
                verification link.
              </p>
            ) : null}

            <Button
              asChild
              className="h-14 w-full rounded bg-[#c6c6c6] text-xs font-bold uppercase tracking-[0.2em] text-[#303030] hover:bg-white"
            >
              <Link href="/login">Back to sign in</Link>
            </Button>
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
                Secure onboarding
              </p>
              <h3 className="mb-6 text-5xl font-bold leading-[56px] tracking-normal text-[#e2e2e2]">
                One confirmed inbox.
                <br />
                <span className="italic text-[#c6c6c6]">One ready workspace.</span>
              </h3>
              <p className="text-base leading-6 text-[#cfc4c5]">
                Email verification keeps production spaces tied to real collaborators before access
                is granted.
              </p>
            </div>
          </div>
        </section>
      </main>
    </Suspense>
  );
}
