'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  CheckCheck,
  ChevronRight,
  FilePenLine,
  Link2,
  Palette,
  Pencil,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from '@/lib/toast';

import { WorkspaceHeader } from '@/app/(protected)/studio/components/WorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { clearAccessToken, getAccessToken } from '@/lib/auth-storage';
import { cn } from '@/lib/utils';
import {
  getCurrentUserContextActivities,
  getCurrentUserProfile,
  getApiErrorMessage,
  getGoogleLinkAccountUrl,
  mapActivityLogToUserActivity,
  updateCurrentUserPassword,
  updateCurrentUserProfile,
  uploadAvatarImage,
  type UpdatePasswordPayload,
  type UserActivity,
  type UserProfile,
} from '../services/user-profile-service';

type ProfileTheme = 'dark' | 'light';

const USER_PROFILE_THEME_KEY = 'mangaka:user-profile-theme';

const ACTIVITY_PAGE_SIZE = 7;

function isSessionExpiredError(error: unknown) {
  if (typeof error !== 'object' || !error) {
    return false;
  }

  const response = (
    error as { response?: { status?: number; data?: { message?: string | string[] } } }
  ).response;
  const status = response?.status;
  const rawMessage = response?.data?.message;
  const message = Array.isArray(rawMessage) ? rawMessage.join(' ') : rawMessage;

  return (
    status === 401 ||
    status === 403 ||
    message?.toLowerCase().includes('invalid email or password') ||
    message?.toLowerCase().includes('unauthorized')
  );
}

const text = {
  accountSettings: 'Account Settings',
  activityLoading: 'Loading activity...',
  activitySummary: 'Activity Summary',
  appearance: (isDark: boolean) => `Appearance (State ${isDark ? 'Dark' : 'Light'})`,
  assignedEditorBoards: 'Assigned Editor Boards',
  assignedProjects: 'Assigned Projects',
  googleAccountLinked: 'Google Account Linked',
  linkGoogleAccount: 'Link Google Account',
  noActivities: 'No recent activity found.',
  noBoards: 'No assigned editor boards found.',
  noProjects: 'No assigned projects found.',
  retry: 'Retry',
  securityPassword: 'Security & Password',
  viewAll: 'View All',
};

const themeTokens: Record<ProfileTheme, React.CSSProperties> = {
  dark: {
    '--profile-bg': '#222831',
    '--profile-header': '#222831',
    '--profile-surface': '#1a2029',
    '--profile-surface-high': '#242a33',
    '--profile-surface-highest': '#2f353e',
    '--profile-border': '#50555D',
    '--profile-text': '#dde3ef',
    '--profile-title': '#ffffff',
    '--profile-muted': '#C8C8C8',
    '--profile-accent': '#FFD369',
    '--profile-button': '#ffffff',
    '--profile-button-text': '#2f3131',
  } as React.CSSProperties,
  light: {
    '--profile-bg': '#f5f7fb',
    '--profile-header': '#ffffff',
    '--profile-surface': '#ffffff',
    '--profile-surface-high': '#f1f4f8',
    '--profile-surface-highest': '#e5eaf1',
    '--profile-border': '#c9d1dc',
    '--profile-text': '#1f2937',
    '--profile-title': '#0f172a',
    '--profile-muted': '#5f6b7a',
    '--profile-accent': '#b7791f',
    '--profile-button': '#111827',
    '--profile-button-text': '#ffffff',
  } as React.CSSProperties,
};

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'UP'
  );
}

function getPrimaryRole(user: UserProfile | null) {
  return user?.roles[0]?.name ?? 'Team Member';
}

function ActivityTimeline({ activities }: { activities: UserActivity[] }) {
  const icons = [CheckCheck, FilePenLine, UserPlus];

  return (
    <Card className="gap-0 rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-4 text-[var(--profile-text)] ring-0">
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = icons[index] ?? FilePenLine;
          const isFirst = index === 0;
          const isLast = index === activities.length - 1;

          return (
            <div className="flex gap-4" key={activity.id}>
              <div className="relative">
                {!isLast ? (
                  <div className="absolute left-1/2 top-4 h-full w-px -translate-x-1/2 bg-[var(--profile-border)]" />
                ) : null}
                <div
                  className={cn(
                    'relative z-10 flex h-6 w-6 items-center justify-center rounded-full',
                    isFirst
                      ? 'bg-[var(--profile-accent)] text-[#0e141c]'
                      : 'border border-[var(--profile-border)] bg-[var(--profile-surface-highest)] text-[var(--profile-muted)]',
                  )}
                >
                  <Icon className="size-[14px]" />
                </div>
              </div>
              {(() => {
                const details = (
                  <>
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <p className="text-[13px] font-medium leading-4 tracking-[0.02em] text-[var(--profile-title)]">
                        {activity.title}
                      </p>
                      <span className="shrink-0 text-[12px] leading-[18px] text-[var(--profile-muted)]">
                        {activity.timeLabel}
                      </span>
                    </div>
                    <p className="text-[12px] leading-[18px] text-[var(--profile-muted)]">
                      {activity.projectName}
                    </p>
                    {isFirst ? (
                      <div className="mt-2 rounded border border-[var(--profile-border)]/50 bg-[var(--profile-surface-highest)] p-2 text-[12px] italic leading-[18px] text-[var(--profile-text)]">
                        &quot;{activity.description}&quot;
                      </div>
                    ) : (
                      <p className="text-[12px] leading-[18px] text-[var(--profile-muted)]">
                        {activity.description}
                      </p>
                    )}
                  </>
                );

                return activity.href ? (
                  <Link
                    className="flex-1 rounded-md transition-opacity hover:opacity-80"
                    href={activity.href}
                  >
                    {details}
                  </Link>
                ) : (
                  <div className="flex-1">{details}</div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="flex min-h-[112px] items-center justify-center rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-5 text-center text-[13px] text-[var(--profile-muted)] ring-0">
      {message}
    </Card>
  );
}

function SettingsButton({
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-lg bg-[var(--profile-surface-highest)]/30 p-3 text-left text-[var(--profile-title)] transition-colors hover:bg-[var(--profile-surface-highest)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--profile-surface-highest)]/30"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-4">
        <Icon className="size-5 text-[var(--profile-muted)]" />
        <span className="text-[13px] font-medium leading-4 tracking-[0.02em]">{label}</span>
      </div>
      {disabled ? (
        <Check className="size-5 text-[var(--profile-accent)]" />
      ) : (
        <ChevronRight className="size-5 text-[var(--profile-muted)]" />
      )}
    </button>
  );
}

function ChangePasswordDialog({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UpdatePasswordPayload) => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation must match.');
      return;
    }

    await onSubmit({ currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#151b24] p-0 text-[#eef3fb] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-white/[0.08] bg-[#18202c] px-6 py-5">
            <DialogTitle className="text-[22px] text-white">Security & Password</DialogTitle>
            <DialogDescription className="text-[#b8c3d2]">
              Change your password to keep your workspace secure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <Input
              autoFocus
              className="h-10 border-white/[0.14] bg-[#0f1620] text-[#eef3fb]"
              disabled={isSubmitting}
              placeholder="Current password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <Input
              className="h-10 border-white/[0.14] bg-[#0f1620] text-[#eef3fb]"
              disabled={isSubmitting}
              placeholder="New password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Input
              className="h-10 border-white/[0.14] bg-[#0f1620] text-[#eef3fb]"
              disabled={isSubmitting}
              placeholder="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          <DialogFooter className="border-t border-white/[0.08] bg-[#101722] px-6 py-4">
            <Button
              className="border-black bg-black text-white hover:border-black hover:bg-black/85 hover:text-white"
              disabled={isSubmitting}
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="border-black bg-black text-white hover:border-black hover:bg-black/85 hover:text-white"
              disabled={isSubmitting}
              type="submit"
              variant="outline"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UserProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const { notifications } = useRealtimeNotifications(Boolean(currentUser));
  const [allActivities, setAllActivities] = useState<UserActivity[]>([]);
  const [visibleActivityCount, setVisibleActivityCount] = useState(ACTIVITY_PAGE_SIZE);
  const activityScrollRef = useRef<HTMLDivElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [draftDisplayName, setDraftDisplayName] = useState('');
  // Always start with the server-rendered default ('dark') so the client's first
  // render matches SSR output; the stored preference is applied after mount below.
  const [theme, setTheme] = useState<ProfileTheme>('dark');

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(USER_PROFILE_THEME_KEY);
    if (storedTheme === 'light') {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    void loadProfileData();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(USER_PROFILE_THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const activityLog = notifications[0]?.activityLog;

    if (!activityLog) {
      return;
    }

    const nextActivity = mapActivityLogToUserActivity(activityLog);
    setAllActivities((currentActivities) => {
      if (currentActivities.some((activity) => activity.id === nextActivity.id)) {
        return currentActivities;
      }

      return [nextActivity, ...currentActivities];
    });
    // Bump the visible window by one so the new item is shown immediately
    // instead of silently pushing an already-visible item out of view.
    setVisibleActivityCount((current) => current + 1);
  }, [notifications]);

  const themeStyle = useMemo(() => themeTokens[theme], [theme]);
  const displayName = currentUser?.displayName ?? 'Unnamed User';
  const avatarUrl = currentUser?.avatarUrl ?? '';
  const roleName = getPrimaryRole(currentUser);
  const initials = getInitials(displayName);
  const isDarkTheme = theme === 'dark';
  const activities = useMemo(
    () => allActivities.slice(0, visibleActivityCount),
    [allActivities, visibleActivityCount],
  );
  const hasMoreActivities = visibleActivityCount < allActivities.length;

  async function loadProfileData() {
    setIsLoading(true);
    setError('');

    if (!getAccessToken()) {
      clearAccessToken();
      router.replace('/login');
      return;
    }

    try {
      const profileData = await getCurrentUserProfile();
      const activityData = await getCurrentUserContextActivities(profileData.id);

      setCurrentUser(profileData);
      setAllActivities(activityData);
      setVisibleActivityCount(ACTIVITY_PAGE_SIZE);
    } catch (loadError) {
      if (isSessionExpiredError(loadError)) {
        clearAccessToken();
        router.replace('/login');
        return;
      }

      setError(getApiErrorMessage(loadError, 'Unable to load profile data.'));
    } finally {
      setIsLoading(false);
    }
  }

  // Pagination happens entirely client-side (see getCurrentUserContextActivities):
  // the full list is already in memory, so "loading more" is just widening the
  // visible window, no network round trip.
  const loadMoreActivities = useCallback(() => {
    setVisibleActivityCount((current) =>
      Math.min(current + ACTIVITY_PAGE_SIZE, allActivities.length),
    );
  }, [allActivities.length]);

  // Auto-fill: if container isn't overflowing but we have more data, load more.
  useEffect(() => {
    const container = activityScrollRef.current;
    if (!container || !hasMoreActivities) {
      return;
    }

    if (container.scrollHeight <= container.clientHeight) {
      loadMoreActivities();
    }
  }, [activities, hasMoreActivities, loadMoreActivities]);

  // Scroll-based load: trigger load-more when user scrolls near the bottom.
  useEffect(() => {
    const container = activityScrollRef.current;
    if (!container || !hasMoreActivities) {
      return;
    }

    const handleScroll = () => {
      const nearBottom =
        container.scrollTop + container.clientHeight >= container.scrollHeight - 80;
      if (nearBottom) {
        loadMoreActivities();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreActivities, loadMoreActivities]);

  async function saveProfileUpdate(input: { displayName?: string; avatarFile?: File | null }) {
    setIsProfileSubmitting(true);

    try {
      const uploadResult = input.avatarFile
        ? await uploadAvatarImage(input.avatarFile)
        : null;
      const updatedUser = await updateCurrentUserProfile({
        displayName: input.displayName ?? currentUser?.displayName ?? '',
        ...(uploadResult?.avatarUrl ? { avatarUrl: uploadResult.avatarUrl } : {}),
      });

      setCurrentUser((currentUser) => ({
        ...(currentUser ?? updatedUser),
        ...updatedUser,
        roles: updatedUser.roles.length ? updatedUser.roles : (currentUser?.roles ?? []),
      }));
      toast.success('Profile updated successfully');
      return true;
    } catch (updateError) {
      toast.error(getApiErrorMessage(updateError, 'Unable to update your profile.'));
      return false;
    } finally {
      setIsProfileSubmitting(false);
    }
  }

  async function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (file) {
      await saveProfileUpdate({ avatarFile: file });
    }
  }

  function handleStartEditDisplayName() {
    setDraftDisplayName(currentUser?.displayName ?? '');
    setIsEditingDisplayName(true);
  }

  function handleCancelEditDisplayName() {
    setIsEditingDisplayName(false);
  }

  async function handleSaveDisplayName() {
    const trimmedDisplayName = draftDisplayName.trim();

    if (trimmedDisplayName.length < 2) {
      toast.error('Display name must be at least 2 characters.');
      return;
    }

    const succeeded = await saveProfileUpdate({ displayName: trimmedDisplayName });
    if (succeeded) {
      setIsEditingDisplayName(false);
    }
  }

  async function handleUpdatePassword(values: UpdatePasswordPayload) {
    setIsPasswordSubmitting(true);

    try {
      await updateCurrentUserPassword(values);
      setIsPasswordOpen(false);
      toast.success('Password updated successfully');
    } catch (passwordError) {
      toast.error(getApiErrorMessage(passwordError, 'Unable to update password.'));
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-[var(--profile-bg)] text-[var(--profile-text)]',
        isDarkTheme && 'dark',
      )}
      style={themeStyle}
    >
      <ChangePasswordDialog
        isSubmitting={isPasswordSubmitting}
        open={isPasswordOpen}
        onOpenChange={setIsPasswordOpen}
        onSubmit={handleUpdatePassword}
      />

      <WorkspaceHeader title="Profile" />

      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        <section className="relative mb-6 flex flex-col gap-6 overflow-hidden rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-6 md:flex-row md:items-end">
          <div className="pointer-events-none absolute -right-10 -top-10 rotate-12 opacity-5">
            <h2 className="text-[120px] font-bold leading-none text-[var(--profile-title)]">
              MONOLITH
            </h2>
          </div>
          <div className="group relative h-32 w-32 shrink-0">
            <div className="h-32 w-32 overflow-hidden rounded-lg border-2 border-[var(--profile-accent)] bg-[var(--profile-surface-highest)]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${displayName} profile`}
                  className="h-full w-full object-cover"
                  src={avatarUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[32px] font-bold text-[var(--profile-muted)]">
                  {initials}
                </div>
              )}
            </div>
            <input
              accept="image/*"
              className="hidden"
              disabled={isProfileSubmitting}
              ref={avatarInputRef}
              type="file"
              onChange={(event) => void handleAvatarFileChange(event)}
            />
            <button
              aria-label="Edit avatar"
              className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border border-[var(--profile-border)] bg-[var(--profile-surface)] text-[var(--profile-muted)] shadow transition hover:bg-[var(--profile-surface-highest)] hover:text-[var(--profile-title)] disabled:opacity-60"
              disabled={isProfileSubmitting}
              type="button"
              onClick={() => avatarInputRef.current?.click()}
            >
              <Pencil className="size-4" />
            </button>
          </div>
          <div className="relative z-10 flex-1">
            {isEditingDisplayName ? (
              <div className="mb-1 flex items-center gap-2">
                <Input
                  aria-label="Display name"
                  autoFocus
                  className="h-10 max-w-xs border-[var(--profile-border)] bg-[var(--profile-surface)] text-[24px] font-bold text-[var(--profile-title)]"
                  disabled={isProfileSubmitting}
                  value={draftDisplayName}
                  onChange={(event) => setDraftDisplayName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleSaveDisplayName();
                    } else if (event.key === 'Escape') {
                      handleCancelEditDisplayName();
                    }
                  }}
                />
                <button
                  aria-label="Save display name"
                  className="flex size-8 items-center justify-center rounded-full text-[var(--profile-accent)] transition hover:bg-[var(--profile-surface-highest)] disabled:opacity-60"
                  disabled={isProfileSubmitting}
                  type="button"
                  onClick={() => void handleSaveDisplayName()}
                >
                  <Check className="size-4" />
                </button>
                <button
                  aria-label="Cancel edit"
                  className="flex size-8 items-center justify-center rounded-full text-[var(--profile-muted)] transition hover:bg-[var(--profile-surface-highest)] disabled:opacity-60"
                  disabled={isProfileSubmitting}
                  type="button"
                  onClick={handleCancelEditDisplayName}
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-[32px] font-bold leading-10 text-[var(--profile-title)]">
                  {displayName}
                </h2>
                <button
                  aria-label="Edit display name"
                  className="flex size-8 items-center justify-center rounded-full text-[var(--profile-muted)] transition hover:bg-[var(--profile-surface-highest)] hover:text-[var(--profile-title)] disabled:opacity-60"
                  disabled={!currentUser}
                  type="button"
                  onClick={handleStartEditDisplayName}
                >
                  <Pencil className="size-4" />
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4 text-[var(--profile-muted)]">
              <span className="text-[14px]">{currentUser?.email ?? 'Loading...'}</span>
              <Separator className="h-4 bg-[var(--profile-border)]" orientation="vertical" />
              <span className="flex items-center gap-1 text-[14px]">
                <ShieldCheck className="size-[18px]" />
                {roleName}
              </span>
            </div>
          </div>
        </section>

        {error ? (
          <Card className="mb-6 border-[#EF4444]/30 bg-[#EF4444]/10 p-6 text-[var(--profile-text)]">
            <div className="flex items-center justify-between gap-4">
              <p>{error}</p>
              <Button variant="outline" onClick={() => void loadProfileData()}>
                {text.retry}
              </Button>
            </div>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section>
            <h3 className="mb-4 text-[22px] font-semibold text-[var(--profile-title)]">
              {text.activitySummary}
            </h3>
            {isLoading ? (
              <EmptyState message={text.activityLoading} />
            ) : activities.length > 0 ? (
              <div className="max-h-[600px] overflow-y-auto pr-1" ref={activityScrollRef}>
                <ActivityTimeline activities={activities} />
              </div>
            ) : (
              <EmptyState message={text.noActivities} />
            )}
          </section>

          <section>
            <h3 className="mb-4 text-[22px] font-semibold text-[var(--profile-title)]">
              {text.accountSettings}
            </h3>
            <Card className="gap-0 rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-4 text-[var(--profile-text)] ring-0">
              <div className="space-y-2">
                <SettingsButton
                  disabled={currentUser?.googleLinked}
                  icon={Link2}
                  label={currentUser?.googleLinked ? text.googleAccountLinked : text.linkGoogleAccount}
                  onClick={() => {
                    window.location.href = getGoogleLinkAccountUrl();
                  }}
                />
                <SettingsButton
                  icon={ShieldCheck}
                  label={text.securityPassword}
                  onClick={() => setIsPasswordOpen(true)}
                />
                <SettingsButton
                  icon={Palette}
                  label={text.appearance(isDarkTheme)}
                  onClick={() =>
                    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
                  }
                />
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
