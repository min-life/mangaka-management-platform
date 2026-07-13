import { Suspense } from 'react';

import { authImages } from '@/components/auth/auth-assets';
import { AuthHero } from '@/components/auth/AuthHero';
import { AuthForm } from './components/AuthForm';

export default function Page() {
  return (
    <main className="flex min-h-screen overflow-hidden bg-[#222831] text-[#eeeeee]">
      <Suspense>
        <AuthForm
          description="Plan chapters, coordinate your team, and keep every manga project moving."
          fields={[
            {
              id: 'email',
              label: 'Email Address',
              placeholder: 'name@studio.com',
              type: 'email',
            },
            {
              action: {
                href: '/auth/forgot',
                label: 'Forgot password?',
              },
              id: 'password',
              label: 'Password',
              placeholder: '••••••••',
              type: 'password',
            },
          ]}
          footerLinkHref="/register"
          footerLinkLabel="Sign Up"
          footerText="Don't have an account?"
          showSocialLogin
          submitHref="/studio"
          submitLabel="Sign In"
          title="Welcome Back"
        />
      </Suspense>

      <AuthHero
        description="Bring storyboards, files, tasks, and reviews into one focused workspace built for manga teams moving from draft pages to publication."
        image={authImages.hero}
        title={
          <>
            Manage every chapter, <br />
            <span className="italic text-[#FFD369]">from sketch to release.</span>
          </>
        }
      />
    </main>
  );
}
