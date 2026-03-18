import Link from 'next/link';

import LinkButton from '@/components/atoms/LinkButton';
import NoTranslateText from '@/components/atoms/NoTranslateText';
import AppShell from '@/components/templates/AppShell';
import { getHomeLandingText } from '@/components/templates/homeLandingText';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

type HomeLandingPageProps = {
  locale: AppLocale;
};

export default function HomeLandingPage({ locale }: HomeLandingPageProps) {
  const text = getHomeLandingText(locale);
  const periodicTableHref = buildLocalizedAppPath(locale, '/periodic-table');
  const searchHref = buildLocalizedAppPath(locale, '/search');
  const balanceEquationHref = buildLocalizedAppPath(locale, '/balance-equation');
  const molecularEditorHref = buildLocalizedAppPath(locale, '/molecular-editor');
  const loginHref = buildLocalizedAppPath(locale, '/login');

  return (
    <AppShell
      hasToken={false}
      authStatus="anonymous"
      headerShowAccountChrome={false}
      authEntryMode="route"
      showFooter={false}
    >
      <div className="space-y-6 pb-8 md:space-y-8 md:pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-(--border-subtle) bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_28%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.86))] p-5 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.9)] md:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.04),transparent)] md:block" />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)] lg:items-start">
            <div className="space-y-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-(--text-muted)">
                {text.hero.eyebrow}
              </p>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black leading-none text-(--text-strong) sm:text-5xl lg:text-6xl">
                  {text.hero.title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-(--text-muted) sm:text-base">
                  {text.hero.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <LinkButton href={periodicTableHref} variant="primary" size="lg" className="rounded-full px-5">
                  {text.hero.primaryCta}
                </LinkButton>
                <LinkButton href={balanceEquationHref} variant="secondary" size="lg" className="rounded-full px-5">
                  {text.hero.secondaryCta}
                </LinkButton>
                <LinkButton href={molecularEditorHref} variant="ghost" size="lg" className="rounded-full px-5">
                  {text.hero.tertiaryCta}
                </LinkButton>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {text.hero.highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-(--text-muted)"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <aside className="grid gap-3">
              <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)">
                  {text.hero.previewTitle}
                </p>
                <div className="mt-4 space-y-3">
                  {text.examples.map((example) => (
                    <div
                      key={example}
                      className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                    >
                      <NoTranslateText as="p" className="text-sm font-semibold text-(--text-strong)">
                        {example}
                      </NoTranslateText>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(135deg,rgba(45,212,191,0.14),rgba(251,191,36,0.08))] p-4">
                <p className="text-sm font-semibold text-(--text-strong)">
                  {text.finalCta.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <LinkButton href={searchHref} variant="ghost" size="md" className="rounded-full px-4">
                    {text.hero.quickLinks.search}
                  </LinkButton>
                  <LinkButton href={loginHref} variant="ghost" size="md" className="rounded-full px-4">
                    {text.hero.quickLinks.login}
                  </LinkButton>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {text.spotlight.items.map((item) => (
            <article
              key={item.href}
              className="surface-panel rounded-[1.8rem] border border-(--border-subtle) p-5 shadow-sm"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--text-muted)">
                {text.spotlight.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-(--text-strong)">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-(--text-muted)">{item.description}</p>
              <div className="mt-5">
                <LinkButton href={buildLocalizedAppPath(locale, item.href)} variant="ghost" size="md" className="rounded-full px-4">
                  {item.cta}
                </LinkButton>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 rounded-[2rem] border border-(--border-subtle) bg-[linear-gradient(180deg,rgba(15,23,42,0.45),rgba(15,23,42,0.18))] p-5 md:p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-(--text-muted)">
              {text.audience.eyebrow}
            </p>
            <h2 className="text-3xl font-black leading-tight text-(--text-strong)">
              {text.audience.title}
            </h2>
            <p className="text-sm leading-7 text-(--text-muted)">
              {text.audience.description}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {text.audience.items.map((item) => (
              <article key={item.title} className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                <h3 className="text-lg font-semibold text-(--text-strong)">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-(--text-muted)">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="surface-panel rounded-[1.8rem] border border-(--border-subtle) p-5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-(--text-muted)">
              {text.faq.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-(--text-strong)">
              {text.faq.title}
            </h2>
          </div>

          <div className="grid gap-3">
            {text.faq.items.map((item) => (
              <article key={item.question} className="surface-panel rounded-[1.4rem] border border-(--border-subtle) p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-(--text-strong)">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-(--text-muted)">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-(--border-subtle) bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(251,191,36,0.12))] p-5 shadow-sm md:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-black leading-tight text-(--text-strong)">
                {text.finalCta.title}
              </h2>
              <p className="text-sm leading-7 text-(--text-muted)">
                {text.finalCta.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <LinkButton href={periodicTableHref} variant="primary" size="lg" className="rounded-full px-5">
                {text.finalCta.primary}
              </LinkButton>
              <LinkButton href={balanceEquationHref} variant="secondary" size="lg" className="rounded-full px-5">
                {text.finalCta.secondary}
              </LinkButton>
            </div>
          </div>
        </section>

        <footer className="px-1 pt-1 text-center text-xs text-(--text-muted)">
          <p>{text.footer.note}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            <Link href={periodicTableHref} className="hover:text-(--text-strong)">
              {text.hero.primaryCta}
            </Link>
            <Link href={balanceEquationHref} className="hover:text-(--text-strong)">
              {text.hero.secondaryCta}
            </Link>
            <Link href={molecularEditorHref} className="hover:text-(--text-strong)">
              {text.hero.tertiaryCta}
            </Link>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
