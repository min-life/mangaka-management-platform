'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { AxiosError } from 'axios';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { authImages } from '@/components/auth/auth-assets';
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
import {
  validateForgotPassword,
  validateResetPassword,
  type ForgotPasswordErrors,
} from '@/lib/validators/auth';
import { forgotPassword, resetPassword } from '@/services/auth.service';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const isResetMode = Boolean(token);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleForgotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForgotPassword(email);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      setIsSent(true);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setErrors({
        form:
          axiosError.response?.data?.message ??
          'Unable to send reset instructions. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateResetPassword(password, confirmPassword);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !token) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await resetPassword({ token, password });
      router.replace('/login');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setErrors({
        form:
          axiosError.response?.data?.message ??
          'Unable to reset your password. The link may be invalid or expired.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#222831] text-[#eeeeee]">
      <section className={authPanelClassName}>
        <div className="mb-10">
          <div className="mb-8">
            <AuthBrand />
          </div>

          <h2 className="mb-2 text-2xl font-bold leading-8 text-[#eeeeee]">
            {isResetMode ? 'Reset your password' : 'Forgot password?'}
          </h2>
          <p className="text-sm leading-6 text-[#d8dee8]">
            {isResetMode
              ? 'Choose a new password for your MangaStudio account.'
              : 'Enter your email and we will send a reset link to your inbox.'}
          </p>
        </div>

        {isResetMode ? (
          <form className="space-y-5" onSubmit={handleResetSubmit}>
            <div className="space-y-2">
              <label className={authLabelClassName} htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className={`${authInputClassName} pr-12`}
                  id="password"
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

            <div className="space-y-2">
              <label className={authLabelClassName} htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className={`${authInputClassName} pr-12`}
                  id="confirmPassword"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                />
                <button
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[4px] text-[#d8dee8] hover:bg-[#4A5260] hover:text-[#FFD369]"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  type="button"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="text-xs text-red-300">{errors.confirmPassword}</p>
              ) : null}
            </div>

            {errors.form ? <div className={authErrorClassName}>{errors.form}</div> : null}

            <Button className={authPrimaryButtonClassName} disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Reset Password
            </Button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleForgotSubmit}>
            <div className="space-y-2">
              <label className={authLabelClassName} htmlFor="email">
                Email Address
              </label>
              <Input
                autoComplete="email"
                className={authInputClassName}
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@studio.com"
                type="email"
                value={email}
              />
              {errors.email ? <p className="text-xs text-red-300">{errors.email}</p> : null}
            </div>

            {isSent ? (
              <div className="rounded-[4px] border border-[#FFD369]/30 bg-[#FFD369]/10 px-4 py-3 text-sm leading-6 text-[#f4d98a]">
                <p className="font-bold text-[#FFD369]">Email sent successfully</p>
                <p className="mt-1 text-[#f4d98a]">
                  We sent a reset link to:{' '}
                  <span className="font-bold text-[#eeeeee]">{email.trim().toLowerCase()}</span>
                </p>
              </div>
            ) : null}
            {errors.form ? <div className={authErrorClassName}>{errors.form}</div> : null}

            <Button className={authPrimaryButtonClassName} disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Send Reset Link
            </Button>
          </form>
        )}

        <footer className="mt-6 text-center">
          <p className="text-xs font-medium text-[#d8dee8]">
            Remember your password?{' '}
            <Link className="font-black text-[#FFD369] hover:underline" href="/login">
              Back to sign in
            </Link>
          </p>
        </footer>
      </section>

      <AuthHero
        description="Reset your password securely and get back to managing your manga projects."
        image={authImages.hero}
        title={
          <>
            Secure account access. <br />
            <span className="whitespace-nowrap italic text-[#FFD369]">Back to your workspace.</span>
          </>
        }
      />
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
