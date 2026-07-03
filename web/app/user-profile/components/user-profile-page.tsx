'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCheck,
  ChevronRight,
  FilePenLine,
  Languages,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  UserPlus,
} from 'lucide-react';
import { toast } from '@/lib/toast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { usePlatformLanguage, type PlatformLanguage } from '@/contexts/language-context';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { clearAccessToken, getAccessToken } from '@/lib/auth-storage';
import { cn } from '@/lib/utils';
import { AUTH_LOGOUT_EVENT } from '@/types/auth';
import {
  getCurrentUserContextActivities,
  getCurrentUserProfile,
  getApiErrorMessage,
  mapActivityLogToUserActivity,
  updateCurrentUserPassword,
  updateCurrentUserProfile,
  uploadAvatarToDataUrl,
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

const copy: Record<
  PlatformLanguage,
  {
    accountSettings: string;
    activityLoading: string;
    activitySummary: string;
    appearance: (isDark: boolean) => string;
    assignedEditorBoards: string;
    assignedProjects: string;
    editProfile: string;
    language: string;
    noActivities: string;
    noBoards: string;
    noProjects: string;
    retry: string;
    securityPassword: string;
    shareProfile: string;
    viewAll: string;
  }
> = {
  en: {
    accountSettings: 'Account Settings',
    activityLoading: 'Loading activity...',
    activitySummary: 'Activity Summary',
    appearance: (isDark) => `Appearance (State ${isDark ? 'Dark' : 'Light'})`,
    assignedEditorBoards: 'Assigned Editor Boards',
    assignedProjects: 'Assigned Projects',
    editProfile: 'Edit Profile',
    language: 'Language (English/VI)',
    noActivities: 'No recent activity found.',
    noBoards: 'No assigned editor boards found.',
    noProjects: 'No assigned projects found.',
    retry: 'Retry',
    securityPassword: 'Security & Password',
    shareProfile: 'Share Profile',
    viewAll: 'View All',
  },
  vi: {
    accountSettings: 'Cài đặt tài khoản',
    activityLoading: 'Đang tải hoạt động...',
    activitySummary: 'Tóm tắt hoạt động',
    appearance: (isDark) => `Giao diện (${isDark ? 'Tối' : 'Sáng'})`,
    assignedEditorBoards: 'Bảng biên tập được giao',
    assignedProjects: 'Dự án được giao',
    editProfile: 'Chỉnh sửa hồ sơ',
    language: 'Ngôn ngữ (Tiếng Việt/EN)',
    noActivities: 'Chưa có hoạt động gần đây.',
    noBoards: 'Chưa có bảng biên tập được giao.',
    noProjects: 'Chưa có dự án được giao.',
    retry: 'Thử lại',
    securityPassword: 'Bảo mật & mật khẩu',
    shareProfile: 'Chia sẻ hồ sơ',
    viewAll: 'Xem tất cả',
  },
};

const themeTokens: Record<ProfileTheme, React.CSSProperties> = {
  dark: {
    '--profile-bg': '#0e141c',
    '--profile-header': '#080f17',
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
              <div className="flex-1">
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
              </div>
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
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-lg bg-[var(--profile-surface-highest)]/30 p-3 text-left text-[var(--profile-title)] transition-colors hover:bg-[var(--profile-surface-highest)]"
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-4">
        <Icon className="size-5 text-[var(--profile-muted)]" />
        <span className="text-[13px] font-medium leading-4 tracking-[0.02em]">{label}</span>
      </div>
      <ChevronRight className="size-5 text-[var(--profile-muted)]" />
    </button>
  );
}

function EditProfileDialog({
  user,
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  user: UserProfile | null;
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { displayName: string; avatarFile: File | null }) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    setDisplayName(user.displayName ?? '');
    setAvatarFile(null);
    setPreviewUrl(user.avatarUrl ?? '');
  }, [open, user]);

  useEffect(() => {
    if (!avatarFile) {
      return;
    }

    const nextPreview = URL.createObjectURL(avatarFile);
    setPreviewUrl(nextPreview);
    return () => URL.revokeObjectURL(nextPreview);
  }, [avatarFile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDisplayName = displayName.trim();

    if (trimmedDisplayName.length < 2) {
      toast.error('Display name must be at least 2 characters.');
      return;
    }

    await onSubmit({ displayName: trimmedDisplayName, avatarFile });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#151b24] p-0 text-[#eef3fb] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-white/[0.08] bg-[#18202c] px-6 py-5">
            <DialogTitle className="text-[22px] text-white">Edit Profile</DialogTitle>
            <DialogDescription className="text-[#b8c3d2]">
              Update your display name and avatar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-6">
            <div className="space-y-3">
              <Label className="text-[#e5ecf7]">Avatar</Label>
              <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#0f1620] p-4">
                <Avatar className="h-20 w-20 border border-[var(--profile-accent)]">
                  {previewUrl ? <AvatarImage alt="Avatar preview" src={previewUrl} /> : null}
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div>
                  <Input
                    accept="image/*"
                    className="sr-only"
                    disabled={isSubmitting}
                    id="avatarFile"
                    type="file"
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  />
                  <Label
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/[0.14] bg-[#202938] px-4 text-[13px] font-medium text-white hover:bg-[#2b3648]"
                    htmlFor="avatarFile"
                  >
                    <Upload className="size-4" />
                    Upload avatar
                  </Label>
                  <p className="mt-2 text-[12px] text-[#9aa7b8]">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#e5ecf7]" htmlFor="displayName">
                Display name
              </Label>
              <Input
                autoFocus
                className="h-10 border-white/[0.14] bg-[#0f1620] text-[#eef3fb] placeholder:text-[#7f8da1]"
                disabled={isSubmitting}
                id="displayName"
                placeholder="Enter display name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
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
  const { language, toggleLanguage } = usePlatformLanguage();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const { notifications } = useRealtimeNotifications(Boolean(currentUser));
  const [allActivities, setAllActivities] = useState<UserActivity[]>([]);
  const [visibleActivityCount, setVisibleActivityCount] = useState(ACTIVITY_PAGE_SIZE);
  const activityScrollRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
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
    const handleLogout = () => {
      router.replace('/login');
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);

    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    };
  }, [router]);

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
  const text = copy[language];
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

  async function handleShareProfile() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied');
    } catch {
      toast.error('Unable to copy profile link.');
    }
  }

  async function handleUpdateProfile(values: { displayName: string; avatarFile: File | null }) {
    setIsProfileSubmitting(true);

    try {
      const uploadResult = values.avatarFile
        ? await uploadAvatarToDataUrl(values.avatarFile)
        : null;
      const updatedUser = await updateCurrentUserProfile({
        displayName: values.displayName,
        ...(uploadResult?.avatarUrl ? { avatarUrl: uploadResult.avatarUrl } : {}),
      });

      setCurrentUser((currentUser) => ({
        ...(currentUser ?? updatedUser),
        ...updatedUser,
        roles: updatedUser.roles.length ? updatedUser.roles : (currentUser?.roles ?? []),
      }));
      setIsEditProfileOpen(false);
      toast.success('Profile updated successfully');
    } catch (updateError) {
      toast.error(getApiErrorMessage(updateError, 'Unable to update your profile.'));
    } finally {
      setIsProfileSubmitting(false);
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
      <EditProfileDialog
        isSubmitting={isProfileSubmitting}
        open={isEditProfileOpen}
        user={currentUser}
        onOpenChange={setIsEditProfileOpen}
        onSubmit={handleUpdateProfile}
      />
      <ChangePasswordDialog
        isSubmitting={isPasswordSubmitting}
        open={isPasswordOpen}
        onOpenChange={setIsPasswordOpen}
        onSubmit={handleUpdatePassword}
      />

      <header className="sticky top-0 z-40 border-b border-[var(--profile-border)] bg-[var(--profile-header)] px-8 py-4">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <img alt="Inkly" className="h-[50px] w-auto object-contain" src="/brand/1.png" />
            <Separator
              className="hidden h-6 bg-[var(--profile-border)] md:block"
              orientation="vertical"
            />
            <nav className="hidden items-center gap-2 text-[13px] font-medium md:flex">
              <span className="text-[var(--profile-muted)]">Workspace</span>
              <ChevronRight className="size-4 text-[var(--profile-muted)]" />
              <span className="text-[var(--profile-title)]">Profile</span>
            </nav>
          </div>

          <div className="hidden max-w-xl flex-1 lg:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--profile-muted)]" />
              <Input
                className="h-9 rounded-lg border-[var(--profile-border)] bg-[var(--profile-surface)] pl-11 text-[12px]"
                placeholder="Search projects, assets, or team..."
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <NotificationBell
              triggerClassName="text-[var(--profile-muted)] hover:bg-[var(--profile-surface-high)] hover:text-[var(--profile-title)]"
              dotClassName="border-[var(--profile-header)]"
            />
            <Settings className="size-6 text-[var(--profile-muted)]" />
            <Separator className="h-8 bg-[var(--profile-border)]" orientation="vertical" />
            <div className="flex items-center gap-4">
              <Avatar className="h-9 w-9 border border-[var(--profile-accent)]">
                {avatarUrl ? <AvatarImage alt={displayName} src={avatarUrl} /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium text-[var(--profile-title)]">{displayName}</p>
                <p className="text-[10px] font-semibold tracking-[0.05em] text-[var(--profile-muted)]/70">
                  {roleName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        <section className="relative mb-6 flex flex-col gap-6 overflow-hidden rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-6 md:flex-row md:items-end">
          <div className="pointer-events-none absolute -right-10 -top-10 rotate-12 opacity-5">
            <h2 className="text-[120px] font-bold leading-none text-[var(--profile-title)]">
              MONOLITH
            </h2>
          </div>
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
          <div className="relative z-10 flex-1">
            <h2 className="mb-1 text-[32px] font-bold leading-10 text-[var(--profile-title)]">
              {displayName}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-[var(--profile-muted)]">
              <span className="text-[14px]">{currentUser?.email ?? 'Loading...'}</span>
              <Separator className="h-4 bg-[var(--profile-border)]" orientation="vertical" />
              <span className="flex items-center gap-1 text-[14px]">
                <ShieldCheck className="size-[18px]" />
                {roleName}
              </span>
            </div>
          </div>
          <div className="relative z-10 flex gap-4">
            <Button
              className="h-9 rounded-lg border-[var(--profile-border)] bg-transparent px-6 text-[13px] text-[var(--profile-text)]"
              variant="outline"
              onClick={handleShareProfile}
            >
              {text.shareProfile}
            </Button>
            <Button
              className="h-9 rounded-lg bg-[var(--profile-button)] px-6 text-[13px] text-[var(--profile-button-text)]"
              disabled={!currentUser}
              onClick={() => setIsEditProfileOpen(true)}
            >
              {text.editProfile}
            </Button>
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
                  icon={ShieldCheck}
                  label={text.securityPassword}
                  onClick={() => setIsPasswordOpen(true)}
                />
                <SettingsButton icon={Languages} label={text.language} onClick={toggleLanguage} />
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
