'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { authImages } from '@/components/auth/auth-assets';
import { AuthBackLink } from '@/components/auth/AuthBackLink';
import { AuthBrand } from '@/components/auth/AuthBrand';
import { AuthHero } from '@/components/auth/AuthHero';
import {
  authErrorClassName,
  authInputClassName,
  authLabelClassName,
  authPanelClassName,
  authPrimaryButtonClassName,
} from '@/components/auth/auth-styles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useRegister } from '@/hooks/use-register';
import { validateRegister } from '@/lib/validators/auth';

export default function Page() {
  const router = useRouter();
  const { logout, status, user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { errors, isSubmitting, register, setErrors } = useRegister();

  const validate = () => {
    const nextErrors = validateRegister(displayName, email, password);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    await register({ displayName, email, password });
  };

  const signedInName = user?.displayName?.trim() || user?.email || 'Inkly user';
  const signedInInitials = signedInName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#222831] text-[#eeeeee]">
      <section className={authPanelClassName}>
        <div className="mb-10">
          <AuthBackLink />
          <div className="mb-8">
            <AuthBrand />
          </div>
          <h2 className="mb-2 text-2xl font-bold leading-8 text-[#eeeeee]">
            Create Your Account
          </h2>
          <p className="text-sm leading-5 text-[#EEEEEE]">
            Start managing chapters, files, and production tasks with your studio team.
          </p>
        </div>

        {status === 'loading' ? (
          <div className="space-y-5">
            <div className="h-12 animate-shimmer rounded-[4px] bg-[linear-gradient(110deg,#393E46_8%,#4A5260_18%,#393E46_33%)] bg-[length:200%_100%]" />
            <div className="h-12 animate-shimmer rounded-[4px] bg-[linear-gradient(110deg,#393E46_8%,#4A5260_18%,#393E46_33%)] bg-[length:200%_100%]" />
            <div className="h-12 animate-shimmer rounded-[4px] bg-[linear-gradient(110deg,#393E46_8%,#4A5260_18%,#393E46_33%)] bg-[length:200%_100%]" />
            <div className="h-14 animate-shimmer rounded-[4px] bg-[linear-gradient(110deg,#FFD36966_8%,#FFD369_18%,#FFD36966_33%)] bg-[length:200%_100%]" />
          </div>
        ) : null}

        {status === 'authenticated' && user ? (
          <div className="space-y-5">
            <div className="rounded-[6px] border border-[#4A5260] bg-[#101820] p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFD369]">
                You&apos;re already signed in
              </p>
              <div className="mt-4 flex items-center gap-4">
                {user.avatarUrl ? (
                  <img
                    alt={signedInName}
                    className="size-12 rounded-full border border-[#FFD369] object-cover"
                    src={user.avatarUrl}
                  />
                ) : (
                  <span className="grid size-12 place-items-center rounded-full border border-[#FFD369] bg-[#0c1219] text-sm font-black text-[#FFD369]">
                    {signedInInitials || 'I'}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-white">{signedInName}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#aeb7c2]">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <Button
              className={authPrimaryButtonClassName}
              onClick={() => router.push('/studio')}
              type="button"
            >
              Continue to Workspace
            </Button>

            <button
              className="h-12 w-full rounded-[4px] border border-[#4A5260] text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-[#393E46]"
              onClick={() => void logout()}
              type="button"
            >
              Sign out and create another account
            </button>
          </div>
        ) : null}

        {status !== 'loading' && status !== 'authenticated' ? (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className={authLabelClassName} htmlFor="display_name">
              User name
            </label>
            <Input
              className={authInputClassName}
              id="display_name"
              name="display_name"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="accountMoi"
              type="text"
              value={displayName}
            />
            {errors.displayName ? (
              <p className="text-xs text-red-300">{errors.displayName}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className={authLabelClassName} htmlFor="email">
              Email Address
            </label>
            <Input
              autoComplete="email"
              className={authInputClassName}
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@studio.com"
              type="email"
              value={email}
            />
            {errors.email ? <p className="text-xs text-red-300">{errors.email}</p> : null}
          </div>

          <div className="space-y-2">
            <label className={authLabelClassName} htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Input
                autoComplete="new-password"
                className={`${authInputClassName} pr-12`}
                id="password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[4px] text-[#d8dee8] hover:bg-[#4A5260] hover:text-[#FFD369]"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password ? <p className="text-xs text-red-300">{errors.password}</p> : null}
          </div>

          {errors.form ? (
            <div className={authErrorClassName}>
              {errors.form}
            </div>
          ) : null}

          <Button
            className={authPrimaryButtonClassName}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Sign Up
          </Button>
        </form>
        ) : null}

        {status !== 'loading' && status !== 'authenticated' ? (
        <footer className="mt-10 text-center">
          <p className="text-xs font-medium text-[#EEEEEE]">
            You have an account?{' '}
            <Link className="font-black text-[#FFD369] hover:underline" href="/login">
              Login
            </Link>
          </p>
        </footer>
        ) : null}
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
