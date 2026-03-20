'use client';

import { useCallback, useEffect, useRef } from 'react';

import LinkButton from '@/components/atoms/LinkButton';
import MarkdownContent from '@/components/atoms/MarkdownContent';
import Panel from '@/components/atoms/Panel';
import { articleApi } from '@/shared/api/articleApi';
import { buildLocalizedArticleFeedPath } from '@/shared/articles/articleRouting';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import type { ArticleDetail, ArticleStatus } from '@/shared/types/article';
import { logoutSession } from '@/shared/api/authApi';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

import AppShell from './AppShell';
import { getArticleDetailText } from './articleDetailText';

type ArticleDetailWorkspaceProps = {
  locale: AppLocale;
  featureStage: ArticleFeatureStage;
  article: ArticleDetail | null;
  isAvailable: boolean;
  initialErrorMessage: string | null;
};

function resolveStatusLabel(status: ArticleStatus, text: ReturnType<typeof getArticleDetailText>): string {
  if (status === 'draft') {
    return text.status.draft;
  }

  if (status === 'archived') {
    return text.status.archived;
  }

  return text.status.published;
}

export default function ArticleDetailWorkspace({
  locale,
  featureStage,
  article,
  isAvailable,
  initialErrorMessage,
}: ArticleDetailWorkspaceProps) {
  const text = getArticleDetailText(locale);
  const { token, isHydrated, isSilentRefreshBlocked, persistToken, removeToken } = useAuthToken();
  const authSession = useAuthSession({
    token,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
    allowAnonymousRefresh: isHydrated && !isSilentRefreshBlocked,
    skipTokenValidation: true,
  });
  const hasStoredSession = token !== null;
  const hasHeaderToken = !isHydrated || hasStoredSession;
  const showHeaderAccountChrome = isHydrated && hasStoredSession;
  const feedHref = buildLocalizedArticleFeedPath(locale);
  const recordedViewArticleIdRef = useRef<string | null>(null);

  const onLogout = useCallback(() => {
    void logoutSession().catch(() => undefined);
    removeToken({ blockSilentRefresh: true });
  }, [removeToken]);

  useEffect(() => {
    if (!isAvailable || article === null) {
      return;
    }

    if (article.status !== 'published' || article.visibility !== 'public') {
      return;
    }

    if (recordedViewArticleIdRef.current === article.id) {
      return;
    }

    recordedViewArticleIdRef.current = article.id;

    void articleApi
      .recordArticleView({
        articleId: article.id,
        token,
      })
      .catch(() => undefined);
  }, [article, isAvailable, token]);

  if (!isAvailable || article === null) {
    return (
      <AppShell
        hasToken={hasHeaderToken}
        authStatus={isHydrated ? authSession.status : 'checking'}
        headerShowAccountChrome={showHeaderAccountChrome}
        onLogout={onLogout}
        authEntryMode="route"
      >
        <div className="space-y-6 pb-10">
          <section className="rounded-[2.6rem] border border-(--border-subtle) px-5 py-8 md:px-8 md:py-10 surface-panel">
            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-(--text-muted)">
                {text.eyebrow}
              </p>
              <h1 className="text-4xl font-black leading-[0.95] text-(--text-strong) sm:text-5xl">
                {text.unavailableTitle}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-(--text-muted) md:text-lg">
                {initialErrorMessage ?? text.unavailableDescription}
              </p>
              <div className="flex flex-wrap gap-3">
                <LinkButton href={feedHref} variant="secondary" size="lg" className="rounded-full px-6">
                  {text.backToFeed}
                </LinkButton>
              </div>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  const heroStyle = {
    background: [
      'radial-gradient(circle at top left, rgba(251,191,36,0.16), transparent 26%)',
      'radial-gradient(circle at 82% 18%, rgba(14,165,233,0.14), transparent 30%)',
      'linear-gradient(160deg, color-mix(in oklab, var(--surface-2) 94%, var(--background-top)), color-mix(in oklab, var(--surface-1) 88%, var(--background-base)))',
    ].join(', '),
  } as const;
  const publishedLabel =
    article.publishedAt === null
      ? null
      : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(article.publishedAt));
  const updatedLabel = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(article.updatedAt));
  const authorLabel =
    article.author.displayName?.trim() ||
    article.author.username?.trim() ||
    text.authorFallback;

  return (
    <AppShell
      hasToken={hasHeaderToken}
      authStatus={isHydrated ? authSession.status : 'checking'}
      headerShowAccountChrome={showHeaderAccountChrome}
      onLogout={onLogout}
      authEntryMode="route"
    >
      <div className="space-y-8 pb-10">
        <section className="relative overflow-hidden rounded-[2.6rem] px-5 py-8 shadow-[0_40px_120px_-72px_rgba(15,23,42,1)] md:px-8 md:py-10" style={heroStyle}>
          <div className="absolute inset-0 opacity-80">
            <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-300/10 blur-3xl" />
          </div>

          <div className="relative space-y-6">
            <div className="flex flex-wrap gap-3">
              <LinkButton href={feedHref} variant="secondary" size="sm" className="rounded-full px-4">
                {text.backToFeed}
              </LinkButton>
              <span className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-(--text-strong)">
                {resolveStatusLabel(article.status, text)}
              </span>
              {featureStage === 'internal' ? (
                <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-100">
                  {text.internalBadge}
                </span>
              ) : null}
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-(--text-muted)">
                {text.eyebrow}
              </p>
              <h1 className="max-w-4xl text-4xl font-black leading-[0.95] text-(--text-strong) sm:text-5xl lg:text-6xl">
                {article.title}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-(--text-muted) md:text-lg">
                {article.excerpt}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-(--text-muted)">
              <span>{authorLabel}</span>
              {publishedLabel !== null ? <span>{`${text.meta.publishedLabel}: ${publishedLabel}`}</span> : null}
              <span>{`${text.meta.updatedLabel}: ${updatedLabel}`}</span>
            </div>

            {article.coverImage !== null ? (
              <div className="overflow-hidden rounded-[2rem] border border-(--border-subtle) bg-[var(--surface-2)] shadow-[0_30px_90px_-56px_rgba(15,23,42,1)]">
                {/* Cover URLs come from runtime storage/CDN configuration, so we render them directly here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="h-auto w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="surface-panel rounded-[2.2rem] border border-(--border-subtle) p-5 md:p-7">
            <MarkdownContent
              content={article.markdownSource}
              className="space-y-4 text-base leading-8 text-(--text-strong)"
            />
          </section>

          <aside className="space-y-4">
            <Panel className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-(--text-muted)">
                {text.meta.slugLabel}
              </p>
              <p className="break-all text-sm text-(--text-strong)">{article.slug}</p>
            </Panel>

            <Panel className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-(--text-muted)">
                {text.meta.hashtagsLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {article.hashtags.length > 0 ? (
                  article.hashtags.map((hashtag) => (
                    <span
                      key={hashtag.id}
                      className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-(--text-muted)"
                    >
                      #{hashtag.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-(--text-muted)">{text.meta.noHashtags}</span>
                )}
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
