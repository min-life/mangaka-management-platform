import { BadgeCheck } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthHeroProps = {
  badge?: string;
  description: string;
  image: string;
  imageAlt?: string;
  title: ReactNode;
};

export function AuthHero({
  badge = 'Production Grade v2.4',
  description,
  image,
  imageAlt = 'Manga storyboard and drawing tablet workspace',
  title,
}: AuthHeroProps) {
  return (
    <section className="relative hidden flex-1 overflow-hidden bg-[#222831] lg:block">
      <img
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover opacity-75 grayscale-[30%] brightness-[0.62]"
        src={image}
      />
      <div className="absolute inset-0 bg-[#393E46]/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#222831]/15 via-transparent to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#222831] via-[#222831]/20 to-transparent p-16 pb-28">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-[4px] border border-[#FFD369]/40 bg-[#FFD369]/10 px-3 py-1 text-[#FFD369] backdrop-blur-md">
            <BadgeCheck className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">{badge}</span>
          </div>
          <h3 className="mb-6 text-5xl font-bold leading-[56px] tracking-normal text-[#eeeeee]">
            {title}
          </h3>
          <p className="text-base leading-6 text-[#EEEEEE]">{description}</p>
        </div>
      </div>
    </section>
  );
}
