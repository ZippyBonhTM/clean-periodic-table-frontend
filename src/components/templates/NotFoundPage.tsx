import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import NoTranslateText from '@/components/atoms/NoTranslateText';
import { getNotFoundText } from '@/components/templates/notFoundText';
import type { NotFoundTextCatalog } from '@/components/templates/notFoundText';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

type NotFoundPageProps = {
  locale: AppLocale;
};

type PhysicalElementCardProps = {
  element: NotFoundTextCatalog['elements'][number];
  imageUrl: string;
  imageAlt: string;
  className: string;
  delay: string;
};

const specimenMediaBySymbol = {
  S: {
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/2/23/Native_sulfur_%28Vodinskoe_Deposit%3B_quarry_near_Samara%2C_Russia%29_9.jpg',
  },
  U: {
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Ames_Process_uranium_biscuit.jpg',
  },
  Au: {
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Gold_%2879_Au%29.jpg',
  },
} as const satisfies Record<string, { imageUrl: string }>;

function PhysicalElementCard({
  element,
  imageUrl,
  imageAlt,
  className,
  delay,
}: PhysicalElementCardProps) {
  const accentStyleByTone: Record<string, CSSProperties> = {
    cyan: {
      ['--specimen-rgb' as string]: '34, 211, 238',
    },
    violet: {
      ['--specimen-rgb' as string]: '167, 139, 250',
    },
    amber: {
      ['--specimen-rgb' as string]: '245, 158, 11',
    },
  };

  const style = {
    ...accentStyleByTone[element.accent],
    ['--specimen-delay' as string]: delay,
  } satisfies CSSProperties;

  return (
    <article className={`not-found-specimen-card ${className}`} style={style}>
      <div className="relative h-full overflow-hidden rounded-[1.2rem]">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 767px) 42vw, 240px"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,18,0.1),rgba(6,10,18,0.12)_34%,rgba(6,10,18,0.88)_100%)]" />

        <div className="absolute left-3 top-3 rounded-md border border-white/16 bg-black/30 px-2 py-1 text-[10px] font-semibold text-white/78 backdrop-blur-sm">
          {element.number}
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-2 px-4 pb-4 pt-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <NoTranslateText
                as="p"
                className="text-3xl font-black tracking-[-0.08em] text-white md:text-4xl"
              >
                {element.symbol}
              </NoTranslateText>
              <p className="text-base font-bold text-white">{element.name}</p>
            </div>

            <NoTranslateText as="span" className="text-sm font-semibold text-white/88">
              {element.mass}
            </NoTranslateText>
          </div>

          <p className="text-xs font-medium text-white/74">{element.label}</p>
        </div>
      </div>
    </article>
  );
}

function RadiationMeter({ text }: { text: NotFoundTextCatalog['meter'] }) {
  return (
    <aside className="not-found-meter">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-emerald-400/24 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black tracking-[0.24em] text-emerald-300">
          {text.label}
        </span>
        <span className="not-found-meter__beep">{text.status}</span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-black/28 p-3">
        <div className="flex items-end gap-1.5">
          {Array.from({ length: 8 }, (_, index) => (
            <span
              key={index}
              className="not-found-meter__bar"
              style={
                {
                  ['--meter-bar-index' as string]: index,
                } satisfies CSSProperties
              }
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/46">
            {text.level}
          </span>
          <NoTranslateText as="span" className="text-sm font-black text-white">
            9.2
          </NoTranslateText>
        </div>
      </div>
    </aside>
  );
}

export default function NotFoundPage({ locale }: NotFoundPageProps) {
  const text = getNotFoundText(locale);

  return (
    <main className="min-h-screen px-[var(--app-inline-padding)] py-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[var(--app-max-width)] items-center">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-[var(--border-subtle)] bg-[color:color-mix(in_oklab,var(--surface-1)_92%,transparent)] shadow-[0_28px_90px_rgba(2,8,23,0.26)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(245,158,11,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_60%)]" />

          <div className="relative grid min-h-[680px] gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)]">
            <div className="flex flex-col justify-between px-6 py-7 md:px-10 md:py-10 lg:px-14 lg:py-14">
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={buildLocalizedAppPath(locale, '/')}
                    className="inline-flex items-center rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-sm font-semibold text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
                  >
                    {text.brand}
                  </Link>

                  <span className="inline-flex rounded-full border border-[var(--border-subtle)] bg-white/6 px-3 py-1.5 text-xs font-black tracking-[0.22em] text-[var(--text-muted)]">
                    {text.eyebrow}
                  </span>
                </div>

                <div className="max-w-2xl space-y-5">
                  <h1 className="max-w-3xl text-4xl font-black tracking-[-0.08em] text-[var(--text-strong)] md:text-6xl lg:text-7xl">
                    {text.title}
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-[var(--text-muted)] md:text-lg">
                    {text.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={buildLocalizedAppPath(locale, '/')}
                    className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-bold text-[var(--on-accent)] transition hover:bg-[var(--accent-strong)]"
                  >
                    {text.actions.home}
                  </Link>
                  <Link
                    href={buildLocalizedAppPath(locale, '/periodic-table')}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--border-subtle)] px-5 py-3 text-sm font-bold text-[var(--text-strong)] transition hover:border-[var(--accent)] hover:bg-white/6"
                  >
                    {text.actions.periodicTable}
                  </Link>
                </div>
              </div>

              <p className="mt-10 text-sm font-medium text-[var(--text-muted)]">
                {text.stageHint}
              </p>
            </div>

            <div className="relative border-t border-[var(--border-subtle)] px-6 py-8 lg:border-t-0 lg:border-l lg:px-10 lg:py-12">
              <div className="not-found-stage">
                <NoTranslateText as="span" className="not-found-stage__ghost-code">
                  404
                </NoTranslateText>

                <PhysicalElementCard
                  element={text.elements[0]}
                  imageUrl={specimenMediaBySymbol.S.imageUrl}
                  imageAlt={text.elements[0].imageAlt}
                  className="left-[3%] top-[10%] rotate-[-8deg] md:left-[6%]"
                  delay="0s"
                />
                <PhysicalElementCard
                  element={text.elements[1]}
                  imageUrl={specimenMediaBySymbol.U.imageUrl}
                  imageAlt={text.elements[1].imageAlt}
                  className="right-[4%] top-[5%] rotate-[8deg]"
                  delay="1s"
                />
                <PhysicalElementCard
                  element={text.elements[2]}
                  imageUrl={specimenMediaBySymbol.Au.imageUrl}
                  imageAlt={text.elements[2].imageAlt}
                  className="left-[22%] bottom-[12%] rotate-[3deg] md:left-[26%]"
                  delay="1.9s"
                />

                <RadiationMeter text={text.meter} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
