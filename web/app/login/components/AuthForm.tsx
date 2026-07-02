'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { setAccessToken } from '@/lib/auth-storage';
import { validateLogin, type LoginErrors } from '@/lib/validators/auth';
import { login } from '@/services/auth.service';
import { AuthBackLink } from '@/components/auth/AuthBackLink';
import { AuthBrand } from '@/components/auth/AuthBrand';
import {
  authErrorClassName,
  authInputClassName,
  authLabelClassName,
  authPanelClassName,
  authPrimaryButtonClassName,
} from '@/components/auth/auth-styles';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AuthField = {
  id: string;
  label: string;
  placeholder?: string;
  type: string;
  action?: {
    href: string;
    label: string;
  };
};

type AuthFormProps = {
  title: string;
  description: string;
  fields: AuthField[];
  submitLabel: string;
  submitHref: string;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  showSocialLogin?: boolean;
};

export function AuthForm({
  title,
  description,
  fields,
  submitLabel,
  submitHref,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  showSocialLogin = false,
}: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, refreshUser, status, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(
    /\/$/,
    '',
  );
  const oauthError =
    searchParams.get('error') === 'oauth_email_exists'
      ? 'This email is already registered. Please sign in with your email and password.'
      : searchParams.get('error') === 'oauth_failed'
        ? 'Unable to sign in with Google. Please try again.'
        : null;

  const validate = () => {
    const nextErrors = validateLogin(email, password);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      setAccessToken(response.accessToken);
      await refreshUser();
      router.push(submitHref);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message;

      setErrors({
        form:
          message === 'Please verify your email before logging in'
            ? 'Please verify your email before logging in.'
            : (message ?? 'Unable to sign in. Please check your email and password.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = user?.displayName?.trim() || user?.email || 'Inkly user';
  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <section className={authPanelClassName}>
      <div className="mb-8">
        <AuthBackLink />
        <div className="mb-5">
          <AuthBrand />
        </div>
        <h2 className="mb-2 text-[28px] font-bold leading-9 text-[#eeeeee]">{title}</h2>
        <p className="text-sm leading-5 text-[#EEEEEE]">{description}</p>
      </div>

      {status === 'loading' ? (
        <div className="space-y-5">
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
                  alt={displayName}
                  className="size-12 rounded-full border border-[#FFD369] object-cover"
                  src={user.avatarUrl}
                />
              ) : (
                <span className="grid size-12 place-items-center rounded-full border border-[#FFD369] bg-[#0c1219] text-sm font-black text-[#FFD369]">
                  {userInitials || 'I'}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-black text-white">{displayName}</p>
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
            Sign out and use another account
          </button>
        </div>
      ) : null}

      {status !== 'loading' && status !== 'authenticated' ? (
      <form className="space-y-5" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div className="space-y-2" key={field.id}>
            <div className="flex justify-between gap-3">
              <label className={authLabelClassName} htmlFor={field.id}>
                {field.label}
              </label>
              {field.action ? (
                <Link
                  className="text-xs font-bold leading-4 tracking-[0.05em] text-[#FFD369] hover:underline"
                  href={field.action.href}
                >
                  {field.action.label}
                </Link>
              ) : null}
            </div>
            {field.id === 'password' ? (
              <div className="relative">
                <Input
                  autoComplete="current-password"
                  className={`${authInputClassName} pr-12`}
                  id={field.id}
                  name={field.id}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={field.placeholder}
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
            ) : (
              <Input
                autoComplete="email"
                className={authInputClassName}
                id={field.id}
                name={field.id}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={field.placeholder}
                type={field.type}
                value={email}
              />
            )}
            {field.id === 'email' && errors.email ? (
              <p className="text-xs text-red-300">{errors.email}</p>
            ) : null}
            {field.id === 'password' && errors.password ? (
              <p className="text-xs text-red-300">{errors.password}</p>
            ) : null}
          </div>
        ))}

        {errors.form || oauthError ? (
          <div className={authErrorClassName}>{errors.form ?? oauthError}</div>
        ) : null}

        <Button className={authPrimaryButtonClassName} disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>

        {showSocialLogin ? <SocialLogin /> : null}
      </form>
      ) : null}

      {status !== 'authenticated' && status !== 'loading' ? (
      <footer className="mt-10 text-center">
        <p className="text-xs font-medium text-[#EEEEEE]">
          {footerText}{' '}
          <Link className="font-black text-[#FFD369] hover:underline" href={footerLinkHref}>
            {footerLinkLabel}
          </Link>
        </p>
      </footer>
      ) : null}
    </section>
  );
}
