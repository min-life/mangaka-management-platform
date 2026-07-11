'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { AxiosError } from 'axios';

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
import { createPassword } from '@/services/user.service';
import { useAuth } from '@/hooks/useAuth';

export default function SetupPasswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSkip = () => {
    const isAdmin = user?.roles?.some(r => r.code === 'ADMIN' || r.code === 'STAFF') || false;
    router.replace(isAdmin ? '/admin' : '/studio');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createPassword(password);
      handleSkip(); // Navigate to the same destination
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(Array.isArray(err.response.data.message) ? err.response.data.message[0] : err.response.data.message);
      } else {
        setError('Failed to create password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen overflow-hidden bg-[#222831] text-[#eeeeee]">
      <section className={authPanelClassName}>
        <AuthBrand />

        <header className="mb-10 text-center">
          <h1 className="text-[28px] font-black tracking-tight text-[#FFD369]">
            Secure Your Account
          </h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#d8dee8]">
            Your account was created via Google. Please set a password so you can also login with email in the future.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className={authLabelClassName} htmlFor="password">
              New Password
            </label>
            <div className="relative">
              <Input
                autoComplete="new-password"
                className={`${authInputClassName} pr-12`}
                id="password"
                name="password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
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
          </div>

          <div className="space-y-2">
            <label className={authLabelClassName} htmlFor="confirm_password">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                autoComplete="new-password"
                className={`${authInputClassName} pr-12`}
                id="confirm_password"
                name="confirm_password"
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError(null);
                }}
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
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <div className={authErrorClassName}>
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3">
            <Button
              className={authPrimaryButtonClassName}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Set Password
            </Button>
            
            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[8px] text-[15px] font-black text-[#5d6878] hover:text-[#8b94a1] hover:underline"
              onClick={handleSkip}
              type="button"
            >
              Skip for now
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
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
