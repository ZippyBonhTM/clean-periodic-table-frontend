'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';
import Panel from '@/components/atoms/Panel';
import { articleApi } from '@/shared/api/articleApi';
import { buildLocalizedArticleDetailPath } from '@/shared/articles/articleRouting';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import type { ArticleCursorPage, ArticleFeedItem, ArticleStatus } from '@/shared/types/article';
import { logoutSession } from '@/shared/api/authApi';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

import AppShell from './AppShell';
import { getArticleFeedText } from './articleFeedText';

type ArticleFeedWorkspaceProps = {
  locale: AppLocale;
  featureStage: ArticleFeatureStage;
  initialFeed: ArticleCursorPage<ArticleFeedItem>;
  isFeedAvailable: boolean;
  initialErrorMessage: string | null;
};

function mergeFeedItems(
  currentItems: ArticleFeedItem[],
  nextItems: ArticleFeedItem[],
): ArticleFeedItem[] {
  const knownIds = new Set(currentItems.map((item) => item.id));
  return currentItems.concat(nextItems.filter((item) => !knownIds.has(item.id)));
}

function resolveLoadMoreErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function resolveStatusLabel(status: ArticleStatus, text: ReturnType<typeof getArticleFeedText>): string {
  if (status === 'draft') {
    return text.cards.draft;
  }

  if (status === 'archived') {
    return text.cards.archived;
  }

  return text.cards.published;
}

function ArticleFeedCard({
  item,
  locale,
  text,
}: {
  item: ArticleFeedItem;
  locale: AppLocale;
  text: ReturnType<typeof getArticleFeedText>;
}) {
  const publishedLabel =
    item.publishedAt === null
      ? null
      : new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
        }).format(new Date(item.publishedAt));
  const authorLabel =
    item.author.displayName?.trim() ||
    item.author.username?.trim() ||
    text.cards.bylineFallback;
  const hashtagLabels =
    item.hashtags.length > 0 ? item.hashtags.map((hashtag) => `#${hashtag.name}`) : [text.cards.hashtagFallback];
  const articleHref = buildLocalizedArticleDetailPath(locale, item.slug);

  return (
    <article className="surface-panel flex h-full flex-col justify-between rounded-[2rem] border border-(--border-subtle) p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex rounded-full border border-(--border-subtle) bg-white/6 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
            {resolveStatusLabel(item.status, text)}
          </span>
          {publishedLabel !== null ? (
            <time className="text-xs font-medium text-(--text-muted)" dateTime={item.publishedAt ?? undefined}>
              {publishedLabel}
            </time>
          ) : null}
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black leading-tight text-(--text-strong)">
            <Link href={articleHref} className="transition hover:text-(--accent)">
              {item.title.trim().length > 0 ? item.title : text.cards.untitled}
            </Link>
          </h2>
          <p className="text-sm leading-7 text-(--text-muted)">
            {item.excerpt.trim().length > 0 ? item.excerpt : text.cards.noExcerpt}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hashtagLabels.map((label) => (
            <span
              key={`${item.id}-${label}`}
              className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-(--text-muted)"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-(--border-subtle) pt-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-(--text-strong)">{authorLabel}</p>
          <p className="truncate text-xs text-(--text-muted)">{item.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          {item.relevanceScore !== null ? (
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-(--text-muted)">
                {text.cards.scoreLabel}
              </p>
              <p className="text-base font-black text-(--text-strong)">{Math.round(item.relevanceScore)}</p>
            </div>
          ) : null}
          <LinkButton href={articleHref} variant="ghost" size="sm" className="rounded-full px-4">
            {text.cards.openArticle}
          </LinkButton>
        </div>
      </div>
    </article>
  );
}

export default function ArticleFeedWorkspace({
  locale,
  featureStage,
  initialFeed,
  isFeedAvailable,
  initialErrorMessage,
}: ArticleFeedWorkspaceProps) {
  const text = getArticleFeedText(locale);
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
  const [items, setItems] = useState(initialFeed.items);
  const [nextCursor, setNextCursor] = useState(initialFeed.nextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const onLogout = useCallback(() => {
    void logoutSession().catch(() => undefined);
    removeToken({ blockSilentRefresh: true });
  }, [removeToken]);

  const onLoadMore = useCallback(async () => {
    if (nextCursor === null || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const nextFeed = await articleApi.getGlobalFeed({
        cursor: nextCursor,
        limit: 12,
      });

      setItems((currentItems) => mergeFeedItems(currentItems, nextFeed.items));
      setNextCursor(nextFeed.nextCursor);
    } catch (caughtError: unknown) {
      setLoadMoreError(resolveLoadMoreErrorMessage(caughtError, text.states.loadMoreFailed));
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, nextCursor, text.states.loadMoreFailed]);

  useEffect(() => {
    if (nextCursor === null || loadMoreSentinelRef.current === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void onLoadMore();
        }
      },
      {
        rootMargin: '280px 0px',
      },
    );

    observer.observe(loadMoreSentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [nextCursor, onLoadMore]);

  const availabilityLabel = isFeedAvailable
    ? text.stats.availabilityAvailable
    : text.stats.availabilityUnavailable;
  const heroStyle = {
    background: [
      'radial-gradient(circle at top left, rgba(45,212,191,0.16), transparent 26%)',
      'radial-gradient(circle at 82% 18%, rgba(251,191,36,0.14), transparent 28%)',
      'linear-gradient(160deg, color-mix(in oklab, var(--surface-2) 94%, var(--background-top)), color-mix(in oklab, var(--surface-1) 88%, var(--background-base)))',
    ].join(', '),
  } as const;
  const canShowFeed = isFeedAvailable && items.length > 0;
  const hasEmptyPublicFeed = isFeedAvailable && items.length === 0;
  const summaryLabel = useMemo(
    () => `${items.length} ${text.stats.loadedCountLabel}`,
    [items.length, text.stats.loadedCountLabel],
  );

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
            <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-teal-300/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-(--text-muted)">
                {text.eyebrow}
              </p>
              <h1 className="text-4xl font-black leading-[0.95] text-(--text-strong) sm:text-5xl">
                {text.title}
              </h1>
              <p className="text-base leading-8 text-(--text-muted) md:text-lg">
                {text.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:max-w-sm lg:justify-end">
              {featureStage === 'internal' ? (
                <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-100">
                  {text.internalBadge}
                </span>
              ) : null}
              <span className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-(--text-strong)">
                {summaryLabel}
              </span>
              <span className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-(--text-muted)">
                {availabilityLabel}
              </span>
            </div>
          </div>
        </section>

        {!isFeedAvailable ? (
          <Panel className="space-y-3">
            <p className="text-sm text-rose-200">{initialErrorMessage ?? text.states.unavailable}</p>
          </Panel>
        ) : null}

        {hasEmptyPublicFeed ? (
          <Panel className="space-y-3">
            <p className="text-sm text-(--text-muted)">{text.states.empty}</p>
          </Panel>
        ) : null}

        {canShowFeed ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <ArticleFeedCard key={item.id} item={item} locale={locale} text={text} />
            ))}
          </section>
        ) : null}

        {loadMoreError !== null ? (
          <Panel className="flex flex-col items-start gap-3">
            <p className="text-sm text-rose-200">{loadMoreError}</p>
            <Button variant="secondary" onClick={() => void onLoadMore()}>
              {text.states.retry}
            </Button>
          </Panel>
        ) : null}

        {nextCursor !== null && isFeedAvailable ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div ref={loadMoreSentinelRef} aria-hidden="true" className="h-2 w-full" />
            {isLoadingMore ? (
              <p className="text-sm text-(--text-muted)">{text.states.loadingMore}</p>
            ) : (
              <Button variant="ghost" onClick={() => void onLoadMore()}>
                {text.states.loadMore}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
