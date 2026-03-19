'use client';

import Image from 'next/image';
import Link from 'next/link';

import NoTranslateText from '@/components/atoms/NoTranslateText';
import { getNotFoundText } from '@/components/templates/notFoundText';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

type NotFoundPageProps = {
  locale: AppLocale;
};

export default function NotFoundPage({ locale }: NotFoundPageProps) {
  const text = getNotFoundText(locale);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <Image
        src="/assets/404/usina quebrada.png"
        alt=""
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,10,0.34),rgba(4,6,10,0.5)_34%,rgba(4,6,10,0.78)_100%)]" />

      <div className="not-found-stage__particle-flow" aria-hidden="true">
        <span className="not-found-stage__particle-stream not-found-stage__particle-stream--a" />
        <span className="not-found-stage__particle-stream not-found-stage__particle-stream--b" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <NoTranslateText as="span" className="not-found-stage__ghost-code">
          404
        </NoTranslateText>
      </div>

      <section className="relative z-10 flex min-h-screen items-end md:items-center">
        <div className="w-full px-[var(--app-inline-padding)] py-8 md:py-10">
          <div className="max-w-[min(540px,92vw)] rounded-[1.75rem] border border-white/10 bg-black/28 px-6 py-6 backdrop-blur-sm md:px-8 md:py-8">
            <div className="flex items-center justify-between gap-4">
              <Link
                href={buildLocalizedAppPath(locale, '/')}
                className="inline-flex items-center rounded-full border border-white/14 px-3 py-1.5 text-sm font-semibold text-white/76 transition hover:border-white/24 hover:text-white"
              >
                {text.brand}
              </Link>

              <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs font-black tracking-[0.22em] text-white/64">
                {text.eyebrow}
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <h1 className="max-w-3xl text-4xl font-black tracking-[-0.08em] text-white md:text-6xl lg:text-7xl">
                {text.title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/76 md:text-lg">
                {text.description}
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={buildLocalizedAppPath(locale, '/')}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-extrabold tracking-tight !text-slate-800 visited:!text-slate-800 active:!text-slate-800 transition hover:bg-white/90"
              >
                {text.actions.home}
              </Link>
              <Link
                href={buildLocalizedAppPath(locale, '/periodic-table')}
                className="inline-flex items-center justify-center rounded-full border border-white/18 px-5 py-3 text-sm font-bold text-white transition hover:border-white/32 hover:bg-white/8"
              >
                {text.actions.periodicTable}
              </Link>
            </div>

            <p className="mt-8 text-sm font-medium text-white/58">
              {text.stageHint}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
