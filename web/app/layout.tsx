import { Geist } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { LanguageProvider } from '@/contexts/language-context';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
