'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AxiosError } from 'axios';
import { BookOpen, Loader2, MessageSquare } from 'lucide-react';

import api from '@/lib/api';
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

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
};

type LoginErrors = Partial<{
  email: string;
  password: string;
  form: string;
}>;

const inputClassName =
  'h-12 rounded border-[#4c4546] bg-[#1b1b1b] px-4 text-sm text-[#e2e2e2] placeholder:text-[#988e90] focus-visible:border-blue-500 focus-visible:ring-blue-500/40';

const labelClassName =
  'text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#cfc4c5]';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    const nextErrors: LoginErrors = {};
    const normalizedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
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
      const response = await api.post<LoginResponse, LoginResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      localStorage.setItem('access_token', response.accessToken);
      router.push(submitHref);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message;

      setErrors({
        form:
          message === 'Please verify your email before logging in'
            ? 'Please verify your email before logging in.'
            : message ?? 'Unable to sign in. Please check your email and password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative z-10 flex w-full flex-col justify-center border-r border-[#4c4546] bg-[#131313] px-6 py-12 lg:w-[480px] lg:px-12">
      <div className="mb-12">
        <div className="mb-8 flex items-center gap-3">
          <BookOpen className="size-8 text-[#c6c6c6]" />
          <h1 className="text-xl font-bold text-[#e2e2e2]">MangaStudio</h1>
        </div>
        <h2 className="mb-2 text-2xl font-semibold leading-8 text-[#e2e2e2]">{title}</h2>
        <p className="text-sm leading-5 text-[#cfc4c5]">{description}</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div className="space-y-2" key={field.id}>
            <div className="flex justify-between gap-3">
              <label className={labelClassName} htmlFor={field.id}>
                {field.label}
              </label>
              {field.action ? (
                <Link
                  className="text-xs font-semibold leading-4 tracking-[0.05em] text-[#c6c6c6] hover:underline"
                  href={field.action.href}
                >
                  {field.action.label}
                </Link>
              ) : null}
            </div>
            <Input
              autoComplete={field.id === 'email' ? 'email' : 'current-password'}
              className={inputClassName}
              id={field.id}
              name={field.id}
              onChange={(event) => {
                if (field.id === 'email') {
                  setEmail(event.target.value);
                }

                if (field.id === 'password') {
                  setPassword(event.target.value);
                }
              }}
              placeholder={field.placeholder}
              type={field.type}
              value={field.id === 'email' ? email : field.id === 'password' ? password : undefined}
            />
            {field.id === 'email' && errors.email ? (
              <p className="text-xs text-red-300">{errors.email}</p>
            ) : null}
            {field.id === 'password' && errors.password ? (
              <p className="text-xs text-red-300">{errors.password}</p>
            ) : null}
          </div>
        ))}

        {errors.form || oauthError ? (
          <div className="rounded border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {errors.form ?? oauthError}
          </div>
        ) : null}

        <Button
          className="h-14 w-full rounded bg-[#c6c6c6] text-xs font-bold uppercase tracking-[0.2em] text-[#303030] hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>

        {showSocialLogin ? (
          <>
            <div className="relative flex items-center py-4">
              <div className="h-px flex-1 bg-[#4c4546]" />
              <span className="mx-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#988e90]">
                Or Continue With
              </span>
              <div className="h-px flex-1 bg-[#4c4546]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                className="h-14 rounded border-[#4c4546] bg-transparent text-[#e2e2e2] hover:bg-[#1f1f1f]"
                onClick={() => {
                  window.location.href = `${apiBaseUrl}/auth/google`;
                }}
                type="button"
                variant="outline"
              >
                <span className="size-4 rounded-full border border-[#4c4546] bg-[#c6c6c6]" />
                Google
              </Button>
              <Button
                className="h-14 rounded border-[#4c4546] bg-transparent text-[#e2e2e2] hover:bg-[#1f1f1f]"
                variant="outline"
              >
                <MessageSquare className="size-4" />
                Discord
              </Button>
            </div>
          </>
        ) : null}
      </form>

      <footer className="mt-12 text-center">
        <p className="text-xs text-[#cfc4c5]">
          {footerText}{' '}
          <Link className="font-bold text-[#c6c6c6] hover:underline" href={footerLinkHref}>
            {footerLinkLabel}
          </Link>
        </p>
      </footer>
    </section>
  );
}
