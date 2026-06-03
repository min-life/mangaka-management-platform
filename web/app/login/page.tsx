import Link from 'next/link';
import { BadgeCheck, BookOpen, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { images } from './const/studio-data';
export default function Page() {
  return (
    <main className="flex min-h-screen overflow-hidden bg-[#131313] text-[#e2e2e2]">
      <section className="relative z-10 flex w-full flex-col justify-center border-r border-[#4c4546] bg-[#131313] px-6 py-12 lg:w-[480px] lg:px-12">
        <div className="mb-12">
          <div className="mb-8 flex items-center gap-3">
            <BookOpen className="size-8 text-[#c6c6c6]" />
            <h1 className="text-xl font-bold text-[#e2e2e2]">MangaStudio</h1>
          </div>
          <h2 className="mb-2 text-2xl font-semibold leading-8 text-[#e2e2e2]">Welcome Back</h2>
          <p className="text-sm leading-5 text-[#cfc4c5]">
            Access your production dashboard and creative tools.
          </p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#cfc4c5]"
              htmlFor="email"
            >
              Email Address
            </label>
            <Input
              className="h-12 rounded border-[#4c4546] bg-[#1b1b1b] px-4 text-sm text-[#e2e2e2] placeholder:text-[#988e90] focus-visible:border-blue-500 focus-visible:ring-blue-500/40"
              id="email"
              placeholder="name@studio.com"
              type="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between gap-3">
              <label
                className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#cfc4c5]"
                htmlFor="password"
              >
                Password
              </label>
              <Link
                className="text-xs font-semibold leading-4 tracking-[0.05em] text-[#c6c6c6] hover:underline"
                href="#"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              className="h-12 rounded border-[#4c4546] bg-[#1b1b1b] px-4 text-sm text-[#e2e2e2] placeholder:text-[#988e90] focus-visible:border-blue-500 focus-visible:ring-blue-500/40"
              id="password"
              placeholder="••••••••"
              type="password"
            />
          </div>

          <Button
            asChild
            className="h-14 w-full rounded bg-[#c6c6c6] text-xs font-bold uppercase tracking-[0.2em] text-[#303030] hover:bg-white"
          >
            <Link href="/studio">Sign In</Link>
          </Button>

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
        </form>

        <footer className="mt-12 text-center">
          <p className="text-xs text-[#cfc4c5]">
            Don&apos;t have an account?{' '}
            <Link className="font-bold text-[#c6c6c6] hover:underline" href="/register">
              Join the studio
            </Link>
          </p>
        </footer>
      </section>

      <section className="relative hidden flex-1 overflow-hidden bg-[#0e0e0e] lg:block">
        <img
          alt="Professional manga production workstation"
          className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale brightness-50"
          src={images.loginHero}
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#131313] via-transparent to-transparent p-16">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c6c6c6]/20 bg-[#c6c6c6]/5 px-3 py-1 text-[#c6c6c6] backdrop-blur-md">
              <BadgeCheck className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Production Grade v2.4
              </span>
            </div>
            <h3 className="mb-6 text-5xl font-bold leading-[56px] tracking-normal text-[#e2e2e2]">
              Precision tools for <br />
              <span className="italic text-[#c6c6c6]">modern storytelling.</span>
            </h3>
            <p className="text-base leading-6 text-[#cfc4c5]">
              Streamline your manga production from rough storyboard to final ink. Connect with your
              team, manage chapters, and review artwork in a unified workspace built for
              professionals.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
