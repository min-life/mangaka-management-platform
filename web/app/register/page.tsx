'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { BadgeCheck, BookOpen, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegister, type RegisterErrors } from '@/hooks/use-register';
import { images } from './const/studio-data';

// KietDM #001
export default function Page() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { errors, isSubmitting, register, setErrors } = useRegister();

  const validate = () => {
    const nextErrors: RegisterErrors = {};
    const normalizedEmail = email.trim();

    if (displayName.trim().length < 5) {
      nextErrors.displayName = 'User name must be at least 5 characters.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    await register({ displayName, email, password });
  };

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#131313] text-[#e2e2e2]">
      <section className="relative z-10 flex w-full flex-col justify-center border-r border-[#4c4546] bg-[#131313] px-6 py-12 lg:w-[480px] lg:px-12">
        <div className="mb-10">
          <div className="mb-8 flex items-center gap-3">
            <BookOpen className="size-8 text-[#c6c6c6]" />
            <h1 className="text-xl font-bold text-[#e2e2e2]">MangaStudio</h1>
          </div>
          <h2 className="mb-2 text-2xl font-semibold leading-8 text-[#e2e2e2]">
            Create Your Account
          </h2>
          <p className="text-sm leading-5 text-[#cfc4c5]">
            Join the next generation of manga production.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#cfc4c5]"
              htmlFor="display_name"
            >
              User name
            </label>
            <Input
              className="h-12 rounded border-[#4c4546] bg-[#1b1b1b] px-4 text-sm text-[#e2e2e2] placeholder:text-[#988e90] focus-visible:border-blue-500 focus-visible:ring-blue-500/40"
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
            <label
              className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#cfc4c5]"
              htmlFor="email"
            >
              Email Address
            </label>
            <Input
              autoComplete="email"
              className="h-12 rounded border-[#4c4546] bg-[#1b1b1b] px-4 text-sm text-[#e2e2e2] placeholder:text-[#988e90] focus-visible:border-blue-500 focus-visible:ring-blue-500/40"
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
            <label
              className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#cfc4c5]"
              htmlFor="password"
            >
              Password
            </label>
            <Input
              autoComplete="new-password"
              className="h-12 rounded border-[#4c4546] bg-[#1b1b1b] px-4 text-sm text-[#e2e2e2] placeholder:text-[#988e90] focus-visible:border-blue-500 focus-visible:ring-blue-500/40"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={password}
            />
            {errors.password ? <p className="text-xs text-red-300">{errors.password}</p> : null}
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#cfc4c5]"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <Input
              autoComplete="new-password"
              className="h-12 rounded border-[#4c4546] bg-[#1b1b1b] px-4 text-sm text-[#e2e2e2] placeholder:text-[#988e90] focus-visible:border-blue-500 focus-visible:ring-blue-500/40"
              id="confirmPassword"
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={confirmPassword}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-red-300">{errors.confirmPassword}</p>
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
            Sign Up
          </Button>
        </form>

        <footer className="mt-10 text-center">
          <p className="text-xs text-[#cfc4c5]">
            You have an account?{' '}
            <Link className="font-bold text-[#c6c6c6] hover:underline" href="/login">
              Login
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
                Production Grade v2.4
              </span>
            </div>
            <h3 className="mb-6 text-5xl font-bold leading-[56px] tracking-normal text-[#e2e2e2]">
              Precision tools for <br />
              <span className="italic text-[#c6c6c6]">modern storytelling.</span>
            </h3>
            <p className="text-base leading-6 text-[#cfc4c5]">
              Streamline your manga production from rough storyboard to final ink. Connect with your
              team, manage chapters, and review artwork in a unified workspace built for
              professionals.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
