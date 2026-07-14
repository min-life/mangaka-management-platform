'use client';

import dynamic from 'next/dynamic';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Root Toaster — only provides the portal/container.
 * All visual styling (colors, border-radius, progress bar) lives in
 * ToastCard (components/ui/toast-card.tsx) which is rendered via
 * toast.custom() through lib/toast.tsx.
 */
const ToasterComponent = ({ ...props }: ToasterProps) => {
  return <Sonner position="top-right" duration={3000} className="inkly-toaster" {...props} />;
};

const Toaster = dynamic(() => Promise.resolve(ToasterComponent), {
  ssr: false,
});

export { Toaster };
