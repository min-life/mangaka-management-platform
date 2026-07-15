import { Geist } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from '@/components/ui/sonner';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Mangaka Studio',
  description: 'A platform for manga creators and teams to collaborate and manage projects.',
  icons: {
    icon: '/brand/3.png',
    shortcut: '/brand/3.png',
    apple: '/brand/3.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster duration={3000} />
      </body>
    </html>
  );
}
