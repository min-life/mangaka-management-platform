'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

type EditableUser = {
  displayName: string | null;
  avatarUrl: string | null;
};

export type EditProfileValues = {
  displayName: string;
  avatarFile: File | null;
};

type EditProfileDialogProps = {
  open: boolean;
  user: EditableUser;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EditProfileValues) => Promise<void>;
};

export function EditProfileDialog({
  open,
  user,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: EditProfileDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <EditProfileDialogContent
      isSubmitting={isSubmitting}
      open={open}
      user={user}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
    />
  );
}

function EditProfileDialogContent({
  open,
  user,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: EditProfileDialogProps) {
  const [displayName, setDisplayName] = useState(user.displayName ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : user.avatarUrl ?? ''),
    [avatarFile, user.avatarUrl],
  );

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      setError('Display name is required.');
      return;
    }

    if (trimmedDisplayName.length < 5) {
      setError('Display name must be at least 5 characters.');
      return;
    }

    setError('');
    await onSubmit({ displayName: trimmedDisplayName, avatarFile });
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
              aria-label="Close edit profile modal"
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
            <DialogTitle className="text-[22px] font-semibold leading-7 text-white">
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-[14px] leading-5 text-[#b8c3d2]">
              Update your display name and profile avatar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[13px] font-medium text-[#e5ecf7]" htmlFor="avatar">
                Avatar
              </Label>
              <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#0f1620] p-4">
                <Avatar className="h-20 w-20 border border-[var(--profile-accent)]">
                {avatarPreview ? (
                  avatarPreview.startsWith('blob:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="Avatar preview"
                      className="h-full w-full rounded-full object-cover"
                      src={avatarPreview}
                    />
                  ) : (
                    <AvatarImage alt="Avatar preview" src={avatarPreview} />
                  )
                ) : null}
                <AvatarFallback>UP</AvatarFallback>
              </Avatar>
                <div className="min-w-0 flex-1">
                  <Input
                    accept="image/*"
                    className="sr-only"
                    disabled={isSubmitting}
                    id="avatar"
                    type="file"
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  />
                  <Label
                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-white/[0.14] bg-[#202938] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2b3648]"
                    htmlFor="avatar"
                  >
                    Upload avatar
                  </Label>
                  <p className="mt-2 text-[12px] leading-[18px] text-[#9aa7b8]">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-[#e5ecf7]" htmlFor="displayName">
                Display name
              </Label>
              <Input
                autoFocus
                className="h-10 w-full rounded-lg border-white/[0.14] bg-[#0f1620] px-3 text-[14px] text-[#eef3fb] placeholder:text-[#7f8da1] focus-visible:border-[var(--profile-accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--profile-accent)]/20"
                disabled={isSubmitting}
                id="displayName"
                minLength={5}
                placeholder="Enter display name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
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
