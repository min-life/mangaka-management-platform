import { BadgeCheck } from 'lucide-react';

import { AuthForm } from './components/AuthForm';
import { images } from './const/studio-data';

// KietDM #001
export default function Page() {
  return (
    <main className="flex min-h-screen overflow-hidden bg-[#131313] text-[#e2e2e2]">
      <AuthForm
        description="Access your production dashboard and creative tools."
        fields={[
          {
            id: 'email',
            label: 'Email Address',
            placeholder: 'name@studio.com',
            type: 'email',
          },
          {
            action: {
              href: '#',
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
