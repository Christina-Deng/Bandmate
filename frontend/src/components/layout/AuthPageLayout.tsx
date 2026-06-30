import type { ReactNode } from 'react';
import { AppearanceMenu } from './AppearanceMenu';
import { PosterBackground } from './PosterBackground';

interface Props {
  title: string;
  lead?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageLayout({ title, lead, children, footer }: Props) {
  return (
    <div className="auth-shell relative min-h-screen px-4 py-8 md:py-12">
      <PosterBackground variant="auth" />
      <div className="relative z-[1] mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr,min(100%,24rem)] md:items-center md:gap-16 lg:grid-cols-[1.1fr,min(100%,26rem)]">
        <aside className="auth-brand relative hidden md:block">
          <p className="font-display-heavy text-5xl leading-none text-accent-600 lg:text-6xl">BandMate</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            乐队排练助手 — 打卡练、团队互相看见、一起把排练节奏稳住。
          </p>
          <p className="auth-watermark" aria-hidden>
            BANDMATE
          </p>
        </aside>

        <div className="relative z-[1] w-full justify-self-end">
          <div className="mb-6 flex items-center justify-between md:justify-end">
            <span className="font-display-heavy text-2xl tracking-widest text-accent-600 md:hidden">
              BandMate
            </span>
            <AppearanceMenu />
          </div>

          <div className="poster-card rounded-xl p-6 md:p-8">
            <h1 className="page-title text-3xl">{title}</h1>
            {lead && <p className="page-lead mt-2">{lead}</p>}
            <div className="mt-6">{children}</div>
          </div>

          {footer && <div className="mt-4 text-center text-sm text-slate-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
