import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function AuthBackLink() {
  return (
    <Link
      className="mb-5 inline-flex w-fit items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-[#aeb7c2] transition-colors hover:text-[#FFD369]"
      href="/"
    >
      <ArrowLeft className="size-3.5" />
      Back to Inkly
    </Link>
  );
}
