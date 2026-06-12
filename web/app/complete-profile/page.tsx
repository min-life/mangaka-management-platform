'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { BadgeCheck, BookOpen, Loader2, UserRoundCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateDisplayName } from '@/services/auth.service';
import { images } from '../register/const/studio-data';

type CompleteProfileErrors = Partial<{
  displayName: string;
  form: string;
}>;

const inputClassName =
  'h-12 rounded border-[#4c4546] bg-[#1b1b1b] px-4 text-sm text-[#e2e2e2] placeholder:text-[#988e90] focus-visible:border-blue-500 focus-visible:ring-blue-500/40';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<CompleteProfileErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.replace('/login');
    }
  }, [router]);

  const validate = () => {
    const nextErrors: CompleteProfileErrors = {};

    if (displayName.trim().length < 5) {
      nextErrors.displayName = 'User name must be at least 5 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await updateDisplayName({ displayName: displayName.trim() });
      router.replace('/studio');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const message = axiosError.response?.data?.message;

      setErrors({
        form: Array.isArray(message)
          ? message[0]
          : message ?? 'Unable to update your profile. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#131313] text-[#e2e2e2]">
      <section className="relative z-10 flex w-full flex-col justify-center border-r border-[#4c4546] bg-[#131313] px-6 py-12 lg:w-[480px] lg:px-12">
        <div className="mb-10">
          <div className="mb-8 flex items-center gap-3">
            <BookOpen className="size-8 text-[#c6c6c6]" />
            <h1 className="text-xl font-bold text-[#e2e2e2]">MangaStudio</h1>
          </div>
          <div className="mb-6 flex size-14 items-center justify-center rounded border border-[#4c4546] bg-[#1b1b1b] text-[#c6c6c6]">
            <UserRoundCheck className="size-7" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold leading-8 text-[#e2e2e2]">
            Complete Your Profile
          </h2>
          <p className="text-sm leading-5 text-[#cfc4c5]">
            Choose the name your studio team will see across your workspace.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#cfc4c5]"
              htmlFor="displayName"
            >
              User name
            </label>
            <Input
              autoComplete="name"
              className={inputClassName}
              id="displayName"
              name="displayName"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="accountMoi"
              type="text"
              value={displayName}
            />
            {errors.displayName ? (
              <p className="text-xs text-red-300">{errors.displayName}</p>
            ) : null}
          </div>

          {errors.form ? (
            <div className="rounded border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {errors.form}
            </div>
          ) : null}

          <Button
            className="h-14 w-full rounded bg-[#c6c6c6] text-xs font-bold uppercase tracking-[0.2em] text-[#303030] hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Continue
          </Button>
        </form>

        <footer className="mt-10 text-center">
          <p className="text-xs text-[#cfc4c5]">
            Signed in with the wrong account?{' '}
            <Link className="font-bold text-[#c6c6c6] hover:underline" href="/login">
              Back to login
            </Link>
          </p>
        </footer>
      </section>

      <section className="relative hidden flex-1 overflow-hidden bg-[#0e0e0e] lg:block">
        <img
          alt="Professional manga production workstation"
          className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale brightness-50"
          src={images.loginHero}
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#131313] via-transparent to-transparent p-16">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c6c6c6]/20 bg-[#c6c6c6]/5 px-3 py-1 text-[#c6c6c6] backdrop-blur-md">
              <BadgeCheck className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Google account verified
              </span>
            </div>
            <h3 className="mb-6 text-5xl font-bold leading-[56px] tracking-normal text-[#e2e2e2]">
              One final mark before <br />
              <span className="italic text-[#c6c6c6]">the workspace opens.</span>
            </h3>
            <p className="text-base leading-6 text-[#cfc4c5]">
              Your email is confirmed through Google. Add a display name so comments, roles, and
              production activity have a clear signature.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
