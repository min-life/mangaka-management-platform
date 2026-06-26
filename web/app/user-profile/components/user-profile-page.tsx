'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  CheckCheck,
  ChevronRight,
  FilePenLine,
  Languages,
  LayoutDashboard,
  Palette,
  PenLine,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import {
  ChangePasswordDialog,
  type ChangePasswordValues,
} from './change-password-dialog';
import { EditProfileDialog, type EditProfileValues } from './edit-profile-dialog';
import { apiActions, type ApiActionKey } from '../const/api-actions';
import {
  getCurrentUserActivities,
  getCurrentUserEditorBoards,
  getCurrentUserProfile,
  getCurrentUserProjects,
  getApiErrorMessage,
  updateCurrentUserPassword,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
  type UserActivity,
  type UserEditorBoard,
  type UserProfile,
  type UserProject,
} from '../services/user-profile-api';

type ProfileTheme = 'dark' | 'light';

const USER_PROFILE_THEME_KEY = 'mangaka:user-profile-theme';
const PROJECT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=512&h=720&fit=crop';

const themeTokens: Record<ProfileTheme, React.CSSProperties> = {
  dark: {
    '--profile-bg': '#0e141c',
    '--profile-header': '#080f17',
    '--profile-surface-low': '#161c25',
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
    '--profile-surface-low': '#eef2f7',
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

function mergeUserProfile(currentUser: UserProfile, updatedUser: UserProfile) {
  return {
    ...currentUser,
    displayName: updatedUser.displayName ?? currentUser.displayName,
    avatarUrl: updatedUser.avatarUrl ?? currentUser.avatarUrl,
    email: updatedUser.email,
    updatedAt: updatedUser.updatedAt,
  };
}

function getPrimaryRoleName(user: UserProfile | null) {
  return user?.roles?.[0]?.name ?? 'Team Member';
}

function getInitials(displayName: string) {
  return displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0])
    .join('')
    .toUpperCase();
}

function readProjectMetrics(project: UserProject) {
  const metrics = project.projectStats?.[0]?.metrics;

  if (typeof metrics === 'object' && metrics !== null && !Array.isArray(metrics)) {
    const values = metrics as { progress?: unknown; statusLabel?: unknown };
    return {
      progress: typeof values.progress === 'number' ? values.progress : 0,
      statusLabel: typeof values.statusLabel === 'string' ? values.statusLabel : 'On Track',
    };
  }

  return { progress: 0, statusLabel: 'On Track' };
}

function logApiAction(actionKey: ApiActionKey) {
  const action = apiActions[actionKey];
  console.info(`[user-profile] ${action.method} ${action.endpoint}`);
}

function ApiButton({
  actionKey,
  className,
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & { actionKey: ApiActionKey }) {
  const action = apiActions[actionKey];

  return (
    <Button
      data-api-endpoint={action.endpoint}
      data-api-method={action.method}
      onClick={(event) => {
        logApiAction(actionKey);
        onClick?.(event);
      }}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}

function NavIconButton({
  actionKey,
  children,
  className,
  ...props
}: React.ComponentProps<'button'> & { actionKey: ApiActionKey }) {
  const action = apiActions[actionKey];

  return (
    <button
      data-api-endpoint={action.endpoint}
      data-api-method={action.method}
      onClick={() => logApiAction(actionKey)}
      className={cn('text-[#C8C8C8] transition-colors hover:text-white', className)}
      {...props}
    >
      {children}
    </button>
  );
}

function ProjectCard({ project }: { project: UserProject }) {
  const { progress, statusLabel } = readProjectMetrics(project);
  const isRevision = statusLabel === 'Revision';

  return (
    <Card className="group gap-0 rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-4 py-4 text-[var(--profile-text)] ring-0 transition-colors hover:border-[var(--profile-accent)]/50">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-16 w-12 items-center justify-center overflow-hidden rounded border border-[var(--profile-border)] bg-[var(--profile-surface-highest)]">
          <Image
            alt={`${project.name} cover`}
            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
            height={64}
            src={project.imageUrl ?? PROJECT_IMAGE_FALLBACK}
            width={48}
          />
        </div>
        <Badge
          className={cn(
            'h-[24px] rounded border px-2 py-1 font-medium',
            isRevision
              ? 'border-[#FFB703]/20 bg-[#FFB703]/10 text-[#FFB703]'
              : 'border-[#4CAF50]/20 bg-[#4CAF50]/10 text-[#4CAF50]',
          )}
        >
          {statusLabel}
        </Badge>
      </div>
      <h4 className="mb-1 text-[18px] font-semibold leading-6 text-[var(--profile-title)]">
        {project.name}
      </h4>
      <p className="mb-4 text-[12px] leading-[18px] text-[var(--profile-muted)]">
        {project.description ?? project.role.name}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--profile-surface-highest)]">
        <div className="h-full bg-[var(--profile-accent)]" style={{ width: `${progress}%` }} />
      </div>
    </Card>
  );
}

function EditorBoardRow({ board, index }: { board: UserEditorBoard; index: number }) {
  const icons = [LayoutDashboard, PenLine, BookOpen];
  const Icon = icons[index] ?? LayoutDashboard;
  const iconClassNames = [
    'bg-[#FFD369]/20 text-[#FFD369]',
    'bg-white/20 text-white',
    'bg-[#474c54]/20 text-[#b7bcc6]',
  ];

  return (
    <button
      data-api-endpoint={apiActions.editorBoards.endpoint}
      data-api-method={apiActions.editorBoards.method}
      onClick={() => logApiAction('editorBoards')}
      className="flex w-full cursor-pointer items-center gap-4 p-4 text-left transition-colors hover:bg-[var(--profile-surface-high)]"
    >
      <div
        className={cn('flex h-10 w-10 items-center justify-center rounded', iconClassNames[index])}
      >
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-[13px] font-medium leading-4 tracking-[0.02em] text-white">
          {board.name}
        </p>
        <p className="text-[12px] leading-[18px] text-[var(--profile-muted)]">
          {board.description ?? (board.isLead ? 'Lead editor board' : 'Assigned editor board')}
        </p>
      </div>
    </button>
  );
}

function ActivityTimeline({ activities }: { activities: UserActivity[] }) {
  const icons = [CheckCheck, FilePenLine, UserPlus];

  return (
    <Card className="gap-0 rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-6 py-6 text-[var(--profile-text)] ring-0">
      <div className="space-y-6">
        {activities.map((task, index) => {
          const Icon = icons[index] ?? FilePenLine;
          const isFirst = index === 0;
          const isLast = index === activities.length - 1;

          return (
            <div className="flex gap-4" key={task.id}>
              <div className="relative">
                {!isLast ? (
                  <div className="absolute left-1/2 top-4 h-full w-px -translate-x-1/2 bg-[var(--profile-border)]" />
                ) : null}
                <div
                  className={cn(
                    'relative z-10 flex h-6 w-6 items-center justify-center rounded-full',
                    isFirst
                      ? 'bg-[#FFD369] text-[#0e141c]'
                      : 'border border-[var(--profile-border)] bg-[var(--profile-surface-highest)] text-[var(--profile-muted)]',
                  )}
                >
                  <Icon className="size-[14px]" />
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-start justify-between">
                  <p className="text-[13px] font-medium leading-4 tracking-[0.02em] text-[var(--profile-title)]">
                    {task.title}
                  </p>
                  <span className="text-[12px] leading-[18px] text-[var(--profile-muted)]">
                    {task.timeLabel}
                  </span>
                </div>
                <p className="text-[12px] leading-[18px] text-[var(--profile-muted)]">
                  {task.projectName}
                </p>
                {isFirst ? (
                  <div className="mt-2 rounded border border-[var(--profile-border)]/50 bg-[var(--profile-surface-highest)] p-2 text-[12px] italic leading-[18px] text-[var(--profile-text)]">
                    &quot;{task.description ?? 'No details provided.'}&quot;
                  </div>
                ) : (
                  <p className="text-[12px] leading-[18px] text-[var(--profile-muted)]">
                    {task.description ?? 'No details provided.'}
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

function SectionEmptyState({ message }: { message: string }) {
  return (
    <Card className="flex min-h-[132px] items-center justify-center rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-6 text-center text-[13px] text-[var(--profile-muted)] ring-0">
      {message}
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="h-[190px] animate-pulse rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-4 ring-0">
      <div className="mb-8 flex items-start justify-between">
        <div className="h-16 w-12 rounded bg-[var(--profile-surface-highest)]" />
        <div className="h-6 w-20 rounded bg-[var(--profile-surface-highest)]" />
      </div>
      <div className="mb-2 h-5 w-2/3 rounded bg-[var(--profile-surface-highest)]" />
      <div className="mb-6 h-3 w-full rounded bg-[var(--profile-surface-highest)]" />
      <div className="h-1 w-full rounded bg-[var(--profile-surface-highest)]" />
    </Card>
  );
}

function ProfileErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-6 text-[var(--profile-text)] ring-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold text-[var(--profile-title)]">
            Unable to load profile data
          </p>
          <p className="mt-1 text-[13px] text-[var(--profile-muted)]">{message}</p>
        </div>
        <Button
          className="h-9 rounded-lg border-[var(--profile-border)] bg-transparent px-5 text-[13px] text-[var(--profile-text)] hover:bg-[var(--profile-surface-highest)]"
          type="button"
          variant="outline"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    </Card>
  );
}

function SettingsButton({
  actionKey,
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  actionKey: ApiActionKey;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const action = apiActions[actionKey];

  return (
    <button
      data-api-endpoint={action.endpoint}
      data-api-method={action.method}
      onClick={() => {
        logApiAction(actionKey);
        onClick?.();
      }}
      className={cn(
        'flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors',
        danger
          ? 'text-[#EF4444] hover:bg-[#EF4444]/10'
          : 'bg-[var(--profile-surface-highest)]/30 text-[var(--profile-title)] hover:bg-[var(--profile-surface-highest)]',
      )}
    >
      <div className="flex items-center gap-4">
        <Icon className={cn('size-5', danger ? 'text-[#EF4444]' : 'text-[var(--profile-muted)]')} />
        <span className="text-[13px] font-medium leading-4 tracking-[0.02em]">{label}</span>
      </div>
      {!danger ? <ChevronRight className="size-5 text-[var(--profile-muted)]" /> : null}
    </button>
  );
}

export function UserProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [userEditorBoards, setUserEditorBoards] = useState<UserEditorBoard[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [theme, setTheme] = useState<ProfileTheme>(() => {
    const storedTheme =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(USER_PROFILE_THEME_KEY)
        : null;

    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    return 'dark';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_PROFILE_THEME_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    void loadProfileData();
  }, []);

  const themeStyle = useMemo(() => themeTokens[theme], [theme]);
  const isDarkTheme = theme === 'dark';
  const displayName = currentUser?.displayName ?? 'Unnamed User';
  const avatarUrl = currentUser?.avatarUrl ?? '';
  const roleName = getPrimaryRoleName(currentUser);
  const avatarFallback = getInitials(displayName) || 'UP';

  async function loadProfileData() {
    setIsProfileLoading(true);
    setProfileError('');

    try {
      const user = await getCurrentUserProfile();
      const [projectsData, editorBoardsData, activitiesData] = await Promise.all([
        getCurrentUserProjects(user.id),
        getCurrentUserEditorBoards(user.id),
        getCurrentUserActivities(),
      ]);

      setCurrentUser(user);
      setUserProjects(projectsData);
      setUserEditorBoards(editorBoardsData);
      setUserActivities(activitiesData);
    } catch (error) {
      setProfileError(getApiErrorMessage(error, 'Unable to load profile data.'));
    } finally {
      setIsProfileLoading(false);
    }
  }

  async function handleShareProfile() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied');
    } catch {
      toast.error('Unable to copy profile link.');
    }
  }

  async function handleUpdateProfile(values: EditProfileValues) {
    setIsProfileSubmitting(true);

    try {
      const uploadedAvatar = values.avatarFile
        ? await uploadCurrentUserAvatar(values.avatarFile)
        : null;
      const updatedUser = await updateCurrentUserProfile({
        displayName: values.displayName,
        ...(uploadedAvatar?.avatarUrl ? { avatarUrl: uploadedAvatar.avatarUrl } : {}),
      });

      setCurrentUser((previousUser) =>
        previousUser ? mergeUserProfile(previousUser, updatedUser) : updatedUser,
      );
      setIsEditProfileOpen(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update your profile.'));
    } finally {
      setIsProfileSubmitting(false);
    }
  }

  async function handleUpdatePassword(values: ChangePasswordValues) {
    setIsPasswordSubmitting(true);
    setPasswordError('');

    try {
      await updateCurrentUserPassword(values);
      setIsPasswordOpen(false);
      toast.success('Password updated successfully');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to update password.');
      setPasswordError(message);
      toast.error(message);
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-[var(--profile-bg)] text-[var(--profile-text)]',
        isDarkTheme && 'dark',
      )}
      style={themeStyle}
    >
      <Toaster position="top-right" />
      {currentUser ? (
        <EditProfileDialog
          isSubmitting={isProfileSubmitting}
          open={isEditProfileOpen}
          user={currentUser}
          onOpenChange={setIsEditProfileOpen}
          onSubmit={handleUpdateProfile}
        />
      ) : null}
      <ChangePasswordDialog
        apiError={passwordError}
        isSubmitting={isPasswordSubmitting}
        open={isPasswordOpen}
        onOpenChange={(open) => {
          setIsPasswordOpen(open);
          if (!open) {
            setPasswordError('');
          }
        }}
        onSubmit={handleUpdatePassword}
      />

      <header className="sticky top-0 z-50 w-full border-b border-[var(--profile-border)] bg-[var(--profile-header)] px-8 py-4">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FFD369] text-[#0e141c]">
                <PenLine className="size-5" />
              </div>
              <h1 className="text-[18px] font-semibold leading-6 tracking-tight text-[var(--profile-title)]">
                MangaFlow
              </h1>
            </div>
            <Separator
              className="mx-4 hidden h-6 bg-[var(--profile-border)] md:block"
              orientation="vertical"
            />
            <nav className="hidden items-center gap-2 text-[13px] font-medium leading-4 tracking-[0.02em] md:flex">
              <span className="text-[var(--profile-muted)]">Workspace</span>
              <ChevronRight className="size-4 text-[var(--profile-muted)]" />
              <span className="font-semibold text-[var(--profile-title)]">Profile</span>
            </nav>
          </div>

          <div className="hidden max-w-xl flex-1 lg:block">
            <div className="group relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--profile-muted)] transition-colors group-focus-within:text-[var(--profile-accent)]" />
              <Input
                data-api-endpoint={apiActions.search.endpoint}
                data-api-method={apiActions.search.method}
                className="h-9 rounded-lg border-[var(--profile-border)] bg-[var(--profile-surface)] py-2 pl-11 pr-4 text-[12px] text-[var(--profile-text)] placeholder:text-[var(--profile-muted)]/50 focus-visible:border-[var(--profile-accent)] focus-visible:ring-0"
                placeholder="Search projects, assets, or team..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <NavIconButton actionKey="notifications" className="relative">
              <Bell className="size-6" />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full border border-[#080f17] bg-[#FFD369]" />
            </NavIconButton>
            <NavIconButton actionKey="settings">
              <Settings className="size-6" />
            </NavIconButton>
            <Separator className="h-8 bg-[var(--profile-border)]" orientation="vertical" />
            <div className="flex cursor-pointer items-center gap-4 pl-1">
              <Avatar className="h-9 w-9 border border-[var(--profile-accent)]">
                {avatarUrl ? <AvatarImage alt={displayName} src={avatarUrl} /> : null}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium leading-none tracking-[0.02em] text-[var(--profile-title)]">
                  {displayName}
                </p>
                <p className="text-[10px] font-semibold leading-[14px] tracking-[0.05em] text-[var(--profile-muted)]/70">
                  {roleName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-72px)] max-w-7xl p-8">
        <header className="relative mb-8 flex items-end gap-8 overflow-hidden rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 rotate-12 select-none opacity-5">
            <h2 className="text-[120px] font-bold leading-none text-[var(--profile-title)]">
              MONOLITH
            </h2>
          </div>
          <div className="group relative">
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
                  {avatarFallback}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 pb-1">
            <h2 className="mb-1 text-[32px] font-bold leading-10 tracking-normal text-[var(--profile-title)]">
              {displayName}
            </h2>
            <div className="flex items-center gap-4 text-[var(--profile-muted)]">
              <div className="flex items-center gap-1">
                <span className="text-[14px] leading-5">{currentUser?.email ?? 'Loading...'}</span>
              </div>
              <Separator className="h-4 bg-[var(--profile-border)]" orientation="vertical" />
              <div className="flex items-center gap-1">
                <ShieldCheck className="size-[18px]" />
                <span className="text-[14px] leading-5">{roleName}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <ApiButton
              actionKey="shareProfile"
              variant="outline"
              className="h-9 rounded-lg border-[var(--profile-border)] bg-transparent px-6 py-2 text-[13px] font-medium tracking-[0.02em] text-[var(--profile-text)] hover:bg-[var(--profile-surface-highest)] hover:text-[var(--profile-title)]"
              onClick={handleShareProfile}
            >
              Share Profile
            </ApiButton>
            <ApiButton
              actionKey="editProfile"
              className="h-9 rounded-lg bg-[var(--profile-button)] px-6 py-2 text-[13px] font-medium tracking-[0.02em] text-[var(--profile-button-text)] hover:opacity-90"
              disabled={!currentUser || isProfileLoading}
              onClick={() => setIsEditProfileOpen(true)}
            >
              Edit Profile
            </ApiButton>
          </div>
        </header>

        {profileError ? (
          <div className="mb-6">
            <ProfileErrorState message={profileError} onRetry={() => void loadProfileData()} />
          </div>
        ) : null}

        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[24px] font-semibold leading-8 tracking-normal text-[var(--profile-title)]">
                Assigned Projects
              </h3>
              <button
                data-api-endpoint={apiActions.viewAllProjects.endpoint}
                data-api-method={apiActions.viewAllProjects.method}
                onClick={() => logApiAction('viewAllProjects')}
                className="text-[13px] font-medium leading-4 tracking-[0.02em] text-[var(--profile-accent)] hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {isProfileLoading ? (
                <>
                  <LoadingCard />
                  <LoadingCard />
                </>
              ) : userProjects.length > 0 ? (
                userProjects.map((project) => <ProjectCard key={project.id} project={project} />)
              ) : (
                <div className="md:col-span-2">
                  <SectionEmptyState message="No assigned projects found." />
                </div>
              )}
            </div>
          </section>

          <section className="col-span-12 lg:col-span-4">
            <h3 className="mb-4 text-[24px] font-semibold leading-8 tracking-normal text-[var(--profile-title)]">
              Assigned Editor Boards
            </h3>
            <div className="overflow-hidden rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)]">
              {isProfileLoading ? (
                <div className="space-y-1 p-4">
                  <div className="h-12 animate-pulse rounded bg-[var(--profile-surface-highest)]" />
                  <div className="h-12 animate-pulse rounded bg-[var(--profile-surface-highest)]" />
                  <div className="h-12 animate-pulse rounded bg-[var(--profile-surface-highest)]" />
                </div>
              ) : userEditorBoards.length > 0 ? (
                userEditorBoards.map((board, index) => (
                  <div
                    className="border-b border-[var(--profile-border)] last:border-b-0"
                    key={board.id}
                  >
                    <EditorBoardRow board={board} index={index} />
                  </div>
                ))
              ) : (
                <div className="p-4">
                  <SectionEmptyState message="No assigned editor boards found." />
                </div>
              )}
            </div>
          </section>

          <section className="col-span-12 lg:col-span-7">
            <h3 className="mb-4 text-[24px] font-semibold leading-8 tracking-normal text-[var(--profile-title)]">
              Activity Summary
            </h3>
            {isProfileLoading ? (
              <SectionEmptyState message="Loading activity..." />
            ) : userActivities.length > 0 ? (
              <ActivityTimeline activities={userActivities} />
            ) : (
              <SectionEmptyState message="No recent activity found." />
            )}
          </section>

          <section className="col-span-12 lg:col-span-5">
            <h3 className="mb-4 text-[24px] font-semibold leading-8 tracking-normal text-[var(--profile-title)]">
              Account Settings
            </h3>
            <Card className="gap-0 rounded-xl border border-[var(--profile-border)] bg-[var(--profile-surface)] p-4 py-4 text-[var(--profile-text)] ring-0">
              <div className="space-y-2">
                <SettingsButton
                  actionKey="securityPassword"
                  icon={ShieldCheck}
                  label="Security & Password"
                  onClick={() => setIsPasswordOpen(true)}
                />
                <SettingsButton
                  actionKey="notificationPreferences"
                  icon={Bell}
                  label="Notification Preferences"
                />
                <SettingsButton
                  actionKey="languagePreferences"
                  icon={Languages}
                  label="Language (English/JP)"
                />
                <SettingsButton
                  actionKey="appearancePreferences"
                  icon={Palette}
                  label={`Appearance (State ${isDarkTheme ? 'Dark' : 'Light'})`}
                  onClick={handleToggleTheme}
                />
                {/* <div className="mt-4 border-t border-[#50555D]/30 pt-4">
                  <SettingsButton
                    actionKey="deactivateAccount"
                    icon={Trash2}
                    label="Deactivate Account"
                    danger
                  />
                </div> */}
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
