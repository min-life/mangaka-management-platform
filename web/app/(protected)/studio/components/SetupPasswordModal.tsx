'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { AxiosError } from 'axios';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPassword, hasPassword } from '@/services/user.service';
import { useAuth } from '@/hooks/useAuth';

export function SetupPasswordModal() {
  const { user, status } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (status === 'authenticated' && user) {
      hasPassword()
        .then((hasPwd) => {
          if (isMounted) {
            setIsLoadingCheck(false);
            if (!hasPwd) {
              setOpen(true);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to check password status', err);
          if (isMounted) {
            setIsLoadingCheck(false);
          }
        });
    } else if (status !== 'loading') {
      setIsLoadingCheck(false);
    }

    return () => {
      isMounted = false;
    };
  }, [status, user]);

  const handleSkip = () => {
    setOpen(false);
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
      setOpen(false);
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

  // We don't render anything if we aren't showing the modal to avoid layout shifts.
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent 
        className="w-[calc(100vw-2rem)] max-w-[440px] gap-0 overflow-hidden rounded-[8px] border border-[#303842] bg-[#0c1219] p-0 text-[#eeeeee] shadow-2xl ring-0"
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside to encourage setting a password
          e.preventDefault();
        }}
      >
        <DialogHeader className="flex flex-col items-center border-b border-[#303842] px-6 py-6 text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#FFD369]/10 text-[#FFD369]">
            <ShieldCheck className="size-6" />
          </div>
          <DialogTitle className="text-[22px] font-black leading-7 text-white">
            Secure Your Account
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-[320px] text-[13px] font-semibold leading-5 text-[#aeb7c2]">
            Your account was created via Google. Please set a password so you can also login with your email in the future.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col px-6 py-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]" htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className="h-11 rounded-[5px] border-[#303842] bg-[#101820] pr-12 text-sm font-bold text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
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
                  className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[4px] text-[#8b94a1] hover:bg-[#202832] hover:text-[#FFD369]"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]" htmlFor="confirm_password">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className="h-11 rounded-[5px] border-[#303842] bg-[#101820] pr-12 text-sm font-bold text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
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
                  className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[4px] text-[#8b94a1] hover:bg-[#202832] hover:text-[#FFD369]"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  type="button"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-[5px] border border-red-900/30 bg-red-950/20 px-3 py-2 text-[13px] font-semibold text-red-400">
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3">
            <Button
              className="h-11 rounded-[5px] bg-[#FFD369] text-sm font-black text-[#222831] hover:bg-[#eac04f] disabled:opacity-70"
              disabled={isSubmitting || password.length === 0}
              type="submit"
            >
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Set Password
            </Button>
            
            <button
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[5px] text-xs font-black text-[#8b94a1] hover:bg-[#111923] hover:text-[#dce7f3]"
              onClick={handleSkip}
              type="button"
            >
              Skip for now
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
