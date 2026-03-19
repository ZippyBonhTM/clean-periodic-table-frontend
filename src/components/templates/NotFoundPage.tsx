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

type BrokenElementTileProps = {
  element: NotFoundTextCatalog['elements'][number];
  className: string;
  delay: string;
};

function BrokenElementTile({ element, className, delay }: BrokenElementTileProps) {
  const accentStyleByTone: Record<string, CSSProperties> = {
    cyan: {
      ['--broken-tile-rgb' as string]: '34, 211, 238',
    },
    violet: {
      ['--broken-tile-rgb' as string]: '167, 139, 250',
    },
    amber: {
      ['--broken-tile-rgb' as string]: '245, 158, 11',
    },
  };

  const style = {
    ...accentStyleByTone[element.accent],
    ['--broken-tile-delay' as string]: delay,
  } satisfies CSSProperties;

  return (
    <article className={`not-found-broken-tile ${className}`} style={style}>
      <span className="not-found-broken-tile__crack not-found-broken-tile__crack--primary" />
      <span className="not-found-broken-tile__crack not-found-broken-tile__crack--secondary" />
      <span className="not-found-broken-tile__shard not-found-broken-tile__shard--one" />
      <span className="not-found-broken-tile__shard not-found-broken-tile__shard--two" />

      <div className="relative flex items-start justify-between gap-2">
        <span className="rounded-md border border-white/14 bg-black/14 px-2 py-1 text-[10px] font-semibold text-[var(--text-muted)]">
          {element.number}
        </span>
      </div>

      <div className="relative mt-3">
        <NoTranslateText
          as="p"
          className="text-4xl font-black tracking-[-0.08em] text-[var(--text-strong)] md:text-5xl"
        >
          {element.symbol}
        </NoTranslateText>
        <p className="mt-1 text-lg font-bold text-[var(--text-strong)]">{element.name}</p>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="rounded-full bg-black/12 px-2.5 py-1 text-[var(--text-muted)]">
          {element.label}
        </span>
        <NoTranslateText as="span" className="font-semibold text-[var(--text-strong)]">
          {element.mass}
        </NoTranslateText>
      </div>
    </article>
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
                <NoTranslateText
                  as="span"
                  className="not-found-stage__ghost-code"
                >
                  404
                </NoTranslateText>

                <BrokenElementTile
                  element={text.elements[0]}
                  className="left-[4%] top-[7%] rotate-[-10deg] md:left-[6%]"
                  delay="0s"
                />
                <BrokenElementTile
                  element={text.elements[1]}
                  className="right-[6%] top-[3%] rotate-[7deg]"
                  delay="1.1s"
                />
                <BrokenElementTile
                  element={text.elements[2]}
                  className="left-[18%] bottom-[10%] rotate-[4deg] md:left-[24%]"
                  delay="2s"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
