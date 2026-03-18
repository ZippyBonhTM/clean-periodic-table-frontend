import Link from 'next/link';

import LinkButton from '@/components/atoms/LinkButton';
import AppShell from '@/components/templates/AppShell';
import HomeHeroElementCluster from '@/components/templates/HomeHeroElementCluster';
import { getHomeLandingText } from '@/components/templates/homeLandingText';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

type HomeLandingPageProps = {
  locale: AppLocale;
};

export default function HomeLandingPage({ locale }: HomeLandingPageProps) {
  const text = getHomeLandingText(locale);
  const periodicTableHref = buildLocalizedAppPath(locale, '/periodic-table');
  const balanceEquationHref = buildLocalizedAppPath(locale, '/balance-equation');
  const molecularEditorHref = buildLocalizedAppPath(locale, '/molecular-editor');

  return (
    <AppShell
      hasToken={false}
      authStatus="anonymous"
      headerShowAccountChrome={false}
      authEntryMode="route"
      showFooter={false}
    >
      <div className="space-y-12 pb-12 md:space-y-16 md:pb-16">
        <section className="relative overflow-hidden rounded-[2.8rem] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(20,184,166,0.18),transparent_26%),linear-gradient(160deg,rgba(15,23,42,0.98),rgba(15,23,42,0.9))] px-5 py-8 shadow-[0_40px_120px_-72px_rgba(15,23,42,1)] md:px-8 md:py-12 lg:px-10">
          <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-teal-300/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(19rem,0.95fr)] lg:items-center">
            <div className="space-y-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-(--text-muted)">
                {text.hero.eyebrow}
              </p>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black leading-[0.95] text-(--text-strong) sm:text-5xl lg:text-6xl">
                  {text.hero.title}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-(--text-muted) md:text-lg">
                  {text.hero.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <LinkButton href={periodicTableHref} variant="primary" size="lg" className="rounded-full px-6">
                  {text.hero.primaryCta}
                </LinkButton>
                <LinkButton href={balanceEquationHref} variant="secondary" size="lg" className="rounded-full px-6">
                  {text.hero.secondaryCta}
                </LinkButton>
                <LinkButton href={molecularEditorHref} variant="ghost" size="lg" className="rounded-full px-6">
                  {text.hero.tertiaryCta}
                </LinkButton>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-(--text-muted)">
                {text.hero.highlights.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <HomeHeroElementCluster
              locale={locale}
              title={text.hero.showcaseTitle}
              description={text.hero.showcaseDescription}
              hint={text.hero.showcaseHint}
              rotationHint={text.hero.showcaseRotationHint}
              emptyHint={text.hero.showcaseEmptyHint}
              openTableLabel={text.hero.showcaseOpenTableCta}
            />
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <div className="space-y-6">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-black leading-tight text-(--text-strong) md:text-4xl">
                {text.features.title}
              </h2>
              <p className="text-base leading-8 text-(--text-muted)">
                {text.features.description}
              </p>
            </div>

            <div className="space-y-5">
              {text.features.items.map((item, index) => (
                <article key={item.href} className="border-t border-(--border-subtle) pt-5 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-xl space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-(--text-muted)">
                        {`0${index + 1}`}
                      </p>
                      <h3 className="text-2xl font-bold text-(--text-strong)">{item.title}</h3>
                      <p className="text-sm leading-7 text-(--text-muted)">{item.description}</p>
                    </div>
                    <LinkButton
                      href={buildLocalizedAppPath(locale, item.href)}
                      variant="ghost"
                      size="md"
                      className="rounded-full px-4"
                    >
                      {item.cta}
                    </LinkButton>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-5 border-l border-(--border-subtle) pl-5">
              <div className="space-y-3">
                <h2 className="text-2xl font-black leading-tight text-(--text-strong) md:text-3xl">
                  {text.positioning.title}
                </h2>
                <p className="text-base leading-8 text-(--text-muted)">
                  {text.positioning.description}
                </p>
              </div>

              {text.positioning.items.map((item) => (
                <div key={item.title} className="space-y-2">
                  <h3 className="text-lg font-semibold text-(--text-strong)">{item.title}</h3>
                  <p className="text-sm leading-7 text-(--text-muted)">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black leading-tight text-(--text-strong)">{text.faq.title}</h2>
              {text.faq.items.map((item) => (
                <article key={item.question} className="border-t border-(--border-subtle) pt-4 first:border-t-0 first:pt-0">
                  <h3 className="text-lg font-semibold text-(--text-strong)">{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-(--text-muted)">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.4rem] bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(20,184,166,0.14))] px-5 py-8 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_auto] lg:items-center">
            <div className="space-y-3">
              <h2 className="max-w-3xl text-3xl font-black leading-tight text-(--text-strong) md:text-4xl">
                {text.finalCta.title}
              </h2>
              <p className="max-w-2xl text-base leading-8 text-(--text-muted)">
                {text.finalCta.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <LinkButton href={periodicTableHref} variant="primary" size="lg" className="rounded-full px-6">
                {text.finalCta.primary}
              </LinkButton>
              <LinkButton href={balanceEquationHref} variant="secondary" size="lg" className="rounded-full px-6">
                {text.finalCta.secondary}
              </LinkButton>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-4 pb-2 text-sm text-(--text-muted) md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl">{text.footer.note}</p>
          <div className="flex flex-wrap gap-4">
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
