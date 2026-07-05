'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnauthorizedStateProps {
  title?: string;
  description?: string;
  backToUrl?: string;
  backToText?: string;
}

export function UnauthorizedState({
  title = 'Access Denied',
  description = 'You do not have the required permissions to view this page. Please contact your administrator if you believe this is an error.',
  backToUrl = '/studio',
  backToText = 'Go to Dashboard',
}: UnauthorizedStateProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/10 text-red-400 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]">
        <ShieldAlert className="h-10 w-10 animate-pulse" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      <p className="mb-8 max-w-md text-sm text-[#8B93A5] leading-relaxed">
        {description}
      </p>
      <Button
        asChild
        className="h-10 rounded-lg bg-[#FFD369] px-6 text-sm font-semibold text-[#101820] hover:bg-[#eac04f] transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Link href={backToUrl}>
          {backToText}
        </Link>
      </Button>
    </div>
  );
}
