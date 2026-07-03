'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileStack,
  FolderKanban,
  LogOut,
  UserRound,
  MessageSquareText,
  Rocket,
  Sparkles,
  Users,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const featureItems = [
  {
    description:
      'Deep project hierarchy from series and arcs down to chapters, pages, files, and assignments.',
    icon: FolderKanban,
    title: 'Project Management',
  },
  {
    description:
      'Structured handoffs between artists, assistants, letterers, and editors with clear ownership.',
    icon: ClipboardCheck,
    title: 'Task Workflow',
  },
  {
    description:
      'Version-aware PSD, CLIP, and reference file organization built around manga production.',
    icon: FileStack,
    title: 'File Management',
  },
  {
    description:
      'Pinpoint review comments, approval states, and revision requests without losing file context.',
    icon: MessageSquareText,
    title: 'Review System',
  },
  {
    description:
      'Role-based collaboration that keeps studio leads, editors, and artists focused on the right work.',
    icon: Users,
    title: 'Team Collaboration',
  },
  {
    description:
      'Publishing requests, editorial review queues, and release readiness in one production workspace.',
    icon: Rocket,
    title: 'Publishing Pipeline',
  },
];

const workflowSteps = [
  ['Project', 'Global series settings, team structure, and production direction.'],
  ['Story Arc', 'Batch management for connected chapters and shared visual references.'],
  ['Chapter', 'Granular production status for weekly or volume-based release cycles.'],
  ['Tasks', 'Page-level assignments, review states, ownership, and deadlines.'],
  ['Publish', 'Editorial approval and release packaging when the chapter is ready.'],
];

const stats = [
  ['500+', 'Global Teams'],
  ['25k+', 'Chapters Managed'],
  ['1M+', 'Secure Files'],
  ['99.9%', 'Uptime Record'],
];

const testimonials = [
  {
    body: 'Inkly transformed our weekly production cycle. We reduced file-finding time and finally have a single source of truth for every chapter.',
    name: 'Hiroshi Tanaka',
    role: 'Editorial Director, Zen Media',
  },
  {
    body: 'The version control for PSD files alone is worth the switch. No more final_v2_new_final file chaos.',
    name: 'Sarah Miller',
    role: 'Project Manager, Crown Studios',
  },
  {
    body: 'The task assignments are granular enough for artists to focus on pages while editors manage the logistics.',
    name: 'Elena Rodriguez',
    role: 'Lead Editor, Neo-Comic Collective',
  },
];

const pricingPlans = [
  {
    cta: 'Start Trial',
    features: ['Up to 5 active projects', '500GB storage', 'Team review tools'],
    name: 'Starter',
    price: '$49',
    tone: 'secondary',
  },
  {
    cta: 'Go Studio',
    features: ['Unlimited projects', '2TB storage', 'Multi-editor approvals', 'Automated backups'],
    name: 'Studio',
    price: '$149',
    tone: 'primary',
  },
  {
    cta: 'Contact Sales',
    features: ['Unlimited storage', 'SSO and advanced security', 'Dedicated manager'],
    name: 'Enterprise',
    price: 'Custom',
    tone: 'secondary',
  },
];

const faqs = [
  {
    answer:
      'Yes. Inkly is designed around CLIP, PSD, exported page previews, and the supporting assets used in a professional manga pipeline.',
    question: 'Does Inkly support CLIP STUDIO files?',
  },
  {
    answer:
      'Workspaces use role-based access, project membership, and controlled review flows so unpublished material stays within the right team.',
    question: 'How secure is our intellectual property?',
  },
  {
    answer:
      'Yes. You can invite collaborators to specific projects and assign them work without exposing unrelated studio materials.',
    question: 'Can we invite freelance artists to specific tasks?',
  },
];

const advancedViewerImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBvjQCGN3NPvd2kIdnDiv1kAFsanaqPG3D9Da_mh8oAWs5mJhIS4Q7wzaRKyMtz67To40dlXW3OmOPUqm5TubtH8ngZAS9keCZnw_FR_Jq9WEmRuhdFwTr9QzReFOSmEBPI3neVAyZP0vF_1db9vy6FLhb3_JtSllwN5AJz23c4TfDy30WuEbpOh35FWLGLMcs_NBN3sA0_oyWZrs8LVxK3kGDVAIfPAbdOewESM0A_iXj8J96p9YCfalGNOmVmOTb5tLDQotF5SA';

function ProductMockup() {
  const lanes = [
    ['Storyboard', '12 pages', '65%'],
    ['Line Art', '8 pages', '42%'],
    ['Lettering', '5 pages', '28%'],
  ];

  return (
    <div className="relative mx-auto mt-16 max-w-6xl">
      <div className="absolute inset-10 rounded-full bg-[#FFD369]/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[8px] border border-[#393E46] bg-[#0c1219] shadow-2xl shadow-black/40">
        <div className="flex h-10 items-center gap-2 border-b border-[#393E46] bg-[#1d242d] px-4">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-red-300/25" />
            <span className="size-3 rounded-full bg-[#FFD369]/25" />
            <span className="size-3 rounded-full bg-cyan-300/25" />
          </div>
          <p className="mx-auto text-xs font-bold text-[#aeb7c2]">
            Inkly Hub - Q4 Production Calendar
          </p>
        </div>

        <div className="grid min-h-[520px] grid-cols-1 md:grid-cols-[260px_1fr]">
          <aside className="hidden border-r border-[#393E46] bg-[#101820] p-5 md:block">
            <div className="mb-8 h-7 w-28 rounded bg-[#4b535f]" />
            <div className="space-y-3">
              {['Dashboard', 'Files', 'Tasks', 'Applications'].map((item, index) => (
                <div
                  className={`flex items-center gap-3 rounded-[4px] px-3 py-2 ${
                    index === 1 ? 'bg-[#FFD369]/10 text-[#FFD369]' : 'text-[#aeb7c2]'
                  }`}
                  key={item}
                >
                  <span className="size-3 rounded-sm bg-current opacity-70" />
                  <span className="text-sm font-bold">{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="bg-[#0c1219] p-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD369]">
                  Neon Tokyo Drifters
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">Chapter Production</h2>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full border border-[#393E46] px-3 py-1 text-xs font-bold text-[#aeb7c2]">
                  23 tasks
                </span>
                <span className="rounded-full border border-[#393E46] px-3 py-1 text-xs font-bold text-[#aeb7c2]">
                  4 reviews
                </span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {lanes.map(([title, count, progress]) => (
                <div className="rounded-[6px] border border-[#393E46] bg-[#151c25] p-4" key={title}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white">{title}</h3>
                      <p className="mt-1 text-xs font-bold text-[#aeb7c2]">{count}</p>
                    </div>
                    <span className="text-xs font-black text-[#FFD369]">{progress}</span>
                  </div>
                  <div className="space-y-3">
                    {[0, 1, 2].map((card) => (
                      <div
                        className="rounded-[5px] border border-[#4b535f] bg-[#101820] p-3"
                        key={`${title}-${card}`}
                      >
                        <div className="mb-3 h-24 rounded-[4px] bg-[linear-gradient(135deg,#4b535f,#101820)]" />
                        <div className="h-3 w-3/4 rounded bg-[#4b535f]" />
                        <div className="mt-2 h-3 w-1/2 rounded bg-[#393E46]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#FFD369]">
      {children}
    </p>
  );
}

function getDisplayName(user: ReturnType<typeof useAuth>['user']) {
  return user?.displayName?.trim() || user?.email || 'Inkly user';
}

function UserAvatar({ className = 'size-9' }: { className?: string }) {
  const { user } = useAuth();
  const displayName = getDisplayName(user);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  if (user?.avatarUrl && user.avatarUrl.trim() !== '') {
    return (
      <img
        alt={displayName}
        className={`${className} rounded-full border border-[#FFD369] object-cover`}
        src={user.avatarUrl || undefined}
      />
    );
  }

  return (
    <span
      className={`${className} grid place-items-center rounded-full border border-[#FFD369] bg-[#101820] text-xs font-black text-[#FFD369]`}
    >
      {initials || 'I'}
    </span>
  );
}

function LandingNavActions() {
  const { logout, status, user } = useAuth();
  const displayName = getDisplayName(user);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden h-5 w-14 animate-pulse rounded bg-[#393E46] sm:inline-block" />
        <span className="h-9 w-28 animate-pulse rounded-[6px] bg-[#FFD369]/35" />
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          className="hidden text-sm font-bold text-[#aeb7c2] transition-colors hover:text-white sm:inline"
          href="/login"
        >
          Sign In
        </Link>
        <Link
          className="rounded-[6px] bg-[#FFD369] px-4 py-2 text-sm font-black text-[#222831] transition hover:brightness-110"
          href="/register"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        className="hidden rounded-[6px] border border-[#393E46] px-4 py-2 text-sm font-black text-white transition hover:bg-[#393E46] sm:inline-flex"
        href="/studio"
      >
        Open Workspace
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 transition hover:bg-[#393E46]"
            type="button"
          >
            <UserAvatar />
            <span className="hidden max-w-36 truncate text-sm font-black text-white md:inline">
              {displayName}
            </span>
            <ChevronDown className="size-4 text-[#aeb7c2]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 border-[#393E46] bg-[#151c25] text-[#eeeeee]"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-black text-white">{displayName}</p>
            <p className="mt-1 truncate text-xs font-semibold text-[#aeb7c2]">{user.email}</p>
          </div>
          <DropdownMenuSeparator className="bg-[#393E46]" />
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#393E46] focus:text-white">
            <Link href="/user-profile">
              <UserRound className="mr-2 size-4" />
              My Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#393E46] focus:text-white">
            <Link href="/studio">
              <FolderKanban className="mr-2 size-4" />
              Workspace
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#393E46]" />
          <DropdownMenuItem
            className="cursor-pointer text-red-300 focus:bg-[#393E46] focus:text-red-300"
            onClick={logout}
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function HeroActions() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <span className="inline-flex h-12 w-full animate-pulse rounded-[6px] bg-[#FFD369]/35 sm:w-40" />
        <span className="inline-flex h-12 w-full animate-pulse rounded-[6px] border border-[#393E46] bg-[#151c25] sm:w-36" />
      </div>
    );
  }

  if (status === 'authenticated' && user) {
    return (
      <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <Link
          className="inline-flex h-12 items-center justify-center rounded-[6px] bg-[#FFD369] px-8 text-base font-black text-[#222831] transition hover:brightness-110"
          href="/studio"
        >
          Open Workspace
        </Link>
        <Link
          className="inline-flex h-12 items-center justify-center rounded-[6px] border border-[#393E46] px-8 text-base font-black text-white transition hover:bg-[#393E46]"
          href="/user-profile"
        >
          My Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
      <Link
        className="inline-flex h-12 items-center justify-center rounded-[6px] bg-[#FFD369] px-8 text-base font-black text-[#222831] transition hover:brightness-110"
        href="/register"
      >
        Start Free
      </Link>
      <Link
        className="inline-flex h-12 items-center justify-center rounded-[6px] border border-[#393E46] px-8 text-base font-black text-white transition hover:bg-[#393E46]"
        href="/login"
      >
        Book Demo
      </Link>
    </div>
  );
}

export default function Home() {
  const { status, user } = useAuth();
  const isSignedIn = status === 'authenticated' && user;
  const displayName = getDisplayName(user);

  return (
    <main className="min-h-screen bg-[#222831] text-[#eeeeee]">
      <nav className="sticky top-0 z-50 border-b border-[#393E46] bg-[#222831]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link className="inline-flex items-center" href="/">
              <Image
                alt="Inkly"
                className="h-9 w-auto object-contain"
                height={36}
                src="/brand/1.png"
                width={120}
              />
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              {['Features', 'Workflow', 'Pricing', 'FAQ'].map((item) => (
                <a
                  className="text-sm font-bold text-[#aeb7c2] transition-colors hover:text-[#FFD369]"
                  href={`#${item.toLowerCase()}`}
                  key={item}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
          <LandingNavActions />
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-24 pt-20 lg:px-8 lg:pt-28">
        <div className="absolute inset-x-0 top-0 h-[680px] bg-[radial-gradient(circle_at_top,#FFD36914,transparent_65%)]" />
        <div className="relative mx-auto max-w-[1440px] text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#393E46] bg-[#101820] px-3 py-1">
            <span className="size-2 rounded-full bg-[#FFD369]" />
            <span className="text-xs font-black uppercase tracking-[0.14em] text-[#aeb7c2]">
              Enterprise-ready manga pipeline
            </span>
          </div>

          <h1 className="mx-auto max-w-5xl text-5xl font-black leading-tight text-white md:text-7xl">
            {isSignedIn ? (
              <>
                Welcome back,{' '}
                <span className="text-[#FFD369]">{displayName.split(' ')[0]}.</span>
              </>
            ) : (
              <>
                Manage every chapter,{' '}
                <span className="text-[#FFD369]">from sketch to release.</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-8 text-[#aeb7c2]">
            {isSignedIn
              ? 'Continue where you left off. Your production workspace, review queues, files, and project tasks are ready.'
              : 'Inkly is the unified workspace built specifically for professional manga studios. Streamline file management, team reviews, and publishing schedules in one technical environment.'}
          </p>

          <HeroActions />

          <ProductMockup />
        </div>
      </section>

      <section className="border-y border-[#393E46] bg-[#0c1219] px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <p className="mb-10 text-center text-xs font-black uppercase tracking-[0.2em] text-[#aeb7c2]/70">
            Architected for industry leaders
          </p>
          <div className="grid gap-6 text-center text-lg font-black text-[#aeb7c2]/70 sm:grid-cols-2 lg:grid-cols-5">
            {['ZENITH STUDIO', 'OMNI GRAPHICS', 'CROWN EDITORIAL', 'NOVA PUBLISHING', 'KINETIC ART'].map(
              (studio) => (
                <span key={studio}>{studio}</span>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8" id="features">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <SectionLabel>Production tools</SectionLabel>
              <h2 className="text-4xl font-black leading-tight text-white">
                A complete ecosystem for high-fidelity production.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-[#aeb7c2]">
                Precision tools designed for the unique demands of sequential art and narrative
                workflows.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-black text-[#FFD369]"
              href={isSignedIn ? '/studio' : '/register'}
            >
              {isSignedIn ? 'Open workspace' : 'Explore platform'} <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureItems.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  className="rounded-[8px] border border-[#393E46] bg-[#151c25] p-6 transition hover:border-[#FFD369]/60 hover:bg-[#393E46]"
                  key={feature.title}
                >
                  <div className="mb-6 grid size-11 place-items-center rounded-[6px] bg-[#FFD369]/10 text-[#FFD369]">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-xl font-black text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#aeb7c2]">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#101820] px-6 py-24 lg:px-8" id="workflow">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-14 text-center">
            <SectionLabel>Workflow</SectionLabel>
            <h2 className="text-4xl font-black text-white">Streamlined continuity</h2>
            <p className="mt-4 text-base font-medium text-[#aeb7c2]">
              The path from concept to reader, visualized and automated.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {workflowSteps.map(([title, description], index) => (
              <article
                className="relative rounded-[8px] border border-[#393E46] bg-[#222831] p-5"
                key={title}
              >
                <span className="mb-6 grid size-10 place-items-center rounded-full bg-[#FFD369] text-sm font-black text-[#222831]">
                  {index + 1}
                </span>
                <h3 className="mb-2 text-lg font-black text-white">{title}</h3>
                <p className="text-sm font-medium leading-6 text-[#aeb7c2]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="group relative overflow-hidden rounded-[8px] border border-[#393E46] bg-[#0c1219]">
            <Image
              alt="Dark manga editor dashboard with high-resolution comic pages and review panels"
              className="aspect-video w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-[1.03]"
              height={810}
              src={advancedViewerImage}
              width={1440}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1219] via-[#0c1219]/35 to-transparent" />
            <div className="absolute bottom-8 left-8 z-10 max-w-xl sm:bottom-12 sm:left-12">
              <span className="mb-4 inline-flex rounded-[4px] bg-[#FFD369] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#222831]">
                Advanced Viewer
              </span>
              <h2 className="text-3xl font-black text-white sm:text-4xl">Focus on the Art.</h2>
              <p className="mt-4 max-w-lg text-sm font-medium leading-6 text-[#eeeeee] sm:text-base sm:leading-7">
                Our high-density lightbox viewer allows editors to inspect 600DPI spreads without
                ever leaving the browser. Instant feedback, infinite detail.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#393E46] bg-[#0c1219] px-6 py-16 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label}>
              <p className="text-4xl font-black text-[#FFD369]">{value}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#aeb7c2]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="mb-14 text-center text-4xl font-black text-white">
            Trusted by the industry&apos;s best editors.
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article
                className="rounded-[8px] border border-[#393E46] bg-[#151c25] p-6"
                key={testimonial.name}
              >
                <p className="text-base font-medium leading-7 text-white">
                  &quot;{testimonial.body}&quot;
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[#FFD369] text-sm font-black text-[#222831]">
                    {testimonial.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </span>
                  <div>
                    <p className="font-black text-white">{testimonial.name}</p>
                    <p className="text-xs font-bold text-[#aeb7c2]">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0c1219] px-6 py-24 lg:px-8" id="pricing">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-14 text-center">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-4xl font-black text-white">Scalable pricing for every stage.</h2>
            <p className="mt-4 text-base font-medium text-[#aeb7c2]">
              Transparent plans with no hidden artist fees.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                className={`rounded-[8px] border p-6 ${
                  plan.tone === 'primary'
                    ? 'border-[#FFD369] bg-[#393E46]'
                    : 'border-[#393E46] bg-[#151c25]'
                }`}
                key={plan.name}
              >
                <h3
                  className={`text-xs font-black uppercase tracking-[0.16em] ${
                    plan.tone === 'primary' ? 'text-[#FFD369]' : 'text-[#aeb7c2]'
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.price.startsWith('$') ? (
                    <span className="pb-1 text-sm font-bold text-[#aeb7c2]">/mo</span>
                  ) : null}
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li className="flex items-center gap-3 text-sm font-bold text-[#aeb7c2]" key={feature}>
                      <CheckCircle2 className="size-4 text-[#FFD369]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-[6px] text-sm font-black ${
                    plan.tone === 'primary'
                      ? 'bg-[#FFD369] text-[#222831]'
                      : 'border border-[#393E46] text-white hover:bg-[#393E46]'
                  }`}
                  href="/register"
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8" id="faq">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-4xl font-black text-white">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                className="group rounded-[8px] border border-[#393E46] bg-[#151c25] p-5"
                key={faq.question}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-white">
                  {faq.question}
                  <ArrowRight className="size-4 transition group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-sm font-medium leading-6 text-[#aeb7c2]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-24 text-center lg:px-8">
        <div className="absolute inset-0 bg-[#FFD369]/5" />
        <div className="relative mx-auto max-w-4xl">
          <Sparkles className="mx-auto mb-6 size-8 text-[#FFD369]" />
          <h2 className="text-4xl font-black leading-tight text-white">
            Ready to streamline your manga production?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-[#aeb7c2]">
            Join studios that have modernized their workflow. Start your workspace and bring the
            whole production cycle into one focused tool.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-[6px] bg-[#FFD369] px-8 text-base font-black text-[#222831]"
              href={isSignedIn ? '/studio' : '/register'}
            >
              {isSignedIn ? 'Open Workspace' : 'Create Studio Workspace'}
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-[6px] border border-[#393E46] px-8 text-base font-black text-white hover:bg-[#393E46]"
              href={isSignedIn ? '/user-profile' : '/login'}
            >
              {isSignedIn ? 'My Profile' : 'Talk to an Expert'}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#393E46] bg-[#0c1219] px-6 py-12 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Image
              alt="Inkly"
              className="h-10 w-auto object-contain"
              height={40}
              src="/brand/1.png"
              width={132}
            />
            <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-[#aeb7c2]">
              The engineering standard for modern story production and studio management.
            </p>
            <p className="mt-8 text-sm font-medium text-[#aeb7c2]/60">
              (c) 2026 Inkly Studio. All rights reserved.
            </p>
          </div>
          {[
            ['Product', 'Features', 'Integrations', 'Pricing', 'Changelog'],
            ['Resources', 'Documentation', 'API Reference', 'Guides', 'Security'],
            ['Company', 'About', 'Blog', 'Careers', 'Media Kit'],
          ].map(([heading, ...items]) => (
            <div key={heading}>
              <h3 className="mb-4 text-sm font-black text-white">{heading}</h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a className="text-sm font-medium text-[#aeb7c2] hover:text-[#FFD369]" href="#">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}

