'use client';

import { useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Eye, EyeOff, ShieldCheck, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ChangePasswordValues = {
  currentPassword: string;
  newPassword: string;
};

type ChangePasswordDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  apiError: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ChangePasswordValues) => Promise<void>;
};

const MIN_PASSWORD_LENGTH = 6;

export function ChangePasswordDialog({
  open,
  isSubmitting,
  apiError,
  onOpenChange,
  onSubmit,
}: ChangePasswordDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <ChangePasswordDialogContent
      apiError={apiError}
      isSubmitting={isSubmitting}
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
    />
  );
}

function ChangePasswordDialogContent({
  open,
  isSubmitting,
  apiError,
  onOpenChange,
  onSubmit,
}: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const passwordInputType = showPasswords ? 'text' : 'password';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required.');
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation must match.');
      return;
    }

    setError('');
    await onSubmit({ currentPassword, newPassword });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/[0.55] backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          aria-modal="true"
          role="dialog"
          className="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.12] bg-[#151b24] p-6 text-[#eef3fb] shadow-[0_24px_80px_rgba(0,0,0,0.55)] outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <DialogPrimitive.Close asChild>
            <Button
              aria-label="Close security password modal"
              className="absolute right-4 top-4 text-[#9aa7b8] hover:bg-white/10 hover:text-white"
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </DialogPrimitive.Close>

        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-6 pr-8">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--profile-accent)]/30 bg-[var(--profile-accent)]/15 text-[var(--profile-accent)]">
              <ShieldCheck className="size-5" />
            </div>
            <DialogTitle className="text-[22px] font-semibold leading-7 text-white">
              Security & Password
            </DialogTitle>
            <DialogDescription className="text-[14px] leading-5 text-[#b8c3d2]">
              Change your password to keep your workspace secure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-[#e5ecf7]" htmlFor="currentPassword">
                Current password
              </Label>
              <Input
                autoFocus
                autoComplete="current-password"
                className="h-10 w-full rounded-lg border-white/[0.14] bg-[#0f1620] px-3 text-[14px] text-[#eef3fb] placeholder:text-[#7f8da1] focus-visible:border-[var(--profile-accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--profile-accent)]/20"
                disabled={isSubmitting}
                id="currentPassword"
                placeholder="Enter current password"
                type={passwordInputType}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-[13px] font-medium text-[#e5ecf7]" htmlFor="newPassword">
                  New password
                </Label>
                <button
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#b8c3d2] transition-colors hover:text-white"
                  type="button"
                  onClick={() => setShowPasswords((value) => !value)}
                >
                  {showPasswords ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {showPasswords ? 'Hide' : 'Show'}
                </button>
              </div>
              <div>
                <Input
                  autoComplete="new-password"
                  className="h-10 w-full rounded-lg border-white/[0.14] bg-[#0f1620] px-3 text-[14px] text-[#eef3fb] placeholder:text-[#7f8da1] focus-visible:border-[var(--profile-accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--profile-accent)]/20"
                  disabled={isSubmitting}
                  id="newPassword"
                  minLength={MIN_PASSWORD_LENGTH}
                  placeholder="Enter new password"
                  type={passwordInputType}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <p className="mt-2 text-[12px] leading-[18px] text-[#9aa7b8]">
                  Minimum {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-[#e5ecf7]" htmlFor="confirmPassword">
                Confirm password
              </Label>
              <Input
                autoComplete="new-password"
                className="h-10 w-full rounded-lg border-white/[0.14] bg-[#0f1620] px-3 text-[14px] text-[#eef3fb] placeholder:text-[#7f8da1] focus-visible:border-[var(--profile-accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--profile-accent)]/20"
                disabled={isSubmitting}
                id="confirmPassword"
                minLength={MIN_PASSWORD_LENGTH}
                placeholder="Confirm new password"
                type={passwordInputType}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {error || apiError ? (
              <p className="rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/10 px-3 py-2 text-sm text-[#ffb4ab]">
                {error || apiError}
              </p>
            ) : null}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button
              className="h-9 rounded-lg border-white/[0.14] bg-transparent px-4 text-[#d6deea] hover:bg-white/10 hover:text-white"
              disabled={isSubmitting}
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-9 min-w-24 rounded-lg border-white/[0.14] bg-transparent px-5 font-medium text-[#d6deea] hover:bg-white/10 hover:text-white"
              disabled={isSubmitting}
              type="submit"
              variant="outline"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
