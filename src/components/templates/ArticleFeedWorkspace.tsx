'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import LinkButton from '@/components/atoms/LinkButton';
import Panel from '@/components/atoms/Panel';
import { articleApi } from '@/shared/api/articleApi';
import {
  buildLocalizedArticleDetailPath,
  buildLocalizedArticleFeedBrowsePath,
} from '@/shared/articles/articleRouting';
import type { ArticleFeedBrowseMode } from '@/shared/articles/articleFeedFilters';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import type {
  ArticleCursorPage,
  ArticleFeedItem,
  ArticleHashtag,
  ArticleStatus,
} from '@/shared/types/article';
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
  initialBrowseMode: ArticleFeedBrowseMode;
  initialQuery: string | null;
  initialHashtag: string | null;
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

async function loadBrowseFeedPage(input: {
  mode: ArticleFeedBrowseMode;
  cursor: string;
  query: string | null;
  hashtag: string | null;
}): Promise<ArticleCursorPage<ArticleFeedItem>> {
  if (input.mode === 'search' && input.query !== null) {
    return await articleApi.searchArticles({
      query: input.query,
      cursor: input.cursor,
      limit: 12,
    });
  }

  if (input.mode === 'hashtag' && input.hashtag !== null) {
    return await articleApi.getHashtagFeed({
      hashtag: input.hashtag,
      cursor: input.cursor,
      limit: 12,
    });
  }

  return await articleApi.getGlobalFeed({
    cursor: input.cursor,
    limit: 12,
  });
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
  token,
  text,
}: {
  item: ArticleFeedItem;
  locale: AppLocale;
  token: string | null;
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
  const articleHref = buildLocalizedArticleDetailPath(locale, item.slug);
  const onOpenArticle = useCallback(() => {
    void articleApi
      .recordArticleOpen({
        articleId: item.id,
        token,
      })
      .catch(() => undefined);
  }, [item.id, token]);

  return (
    <article className="surface-panel flex h-full flex-col justify-between rounded-[2rem] border border-(--border-subtle) p-5 shadow-sm">
      <div className="space-y-4">
        {item.coverImage !== null ? (
          <div className="overflow-hidden rounded-[1.6rem] border border-(--border-subtle) bg-[var(--surface-2)]">
            {/* Cover URLs come from runtime storage/CDN configuration, so we render them directly here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.coverImage}
              alt={item.title.trim().length > 0 ? item.title : text.cards.untitled}
              className="h-48 w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

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
            <Link
              href={articleHref}
              className="transition hover:text-(--accent)"
              onClick={onOpenArticle}
            >
              {item.title.trim().length > 0 ? item.title : text.cards.untitled}
            </Link>
          </h2>
          <p className="text-sm leading-7 text-(--text-muted)">
            {item.excerpt.trim().length > 0 ? item.excerpt : text.cards.noExcerpt}
          </p>
        </div>

        {item.hashtags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {item.hashtags.map((hashtag) => (
              <Link
                key={`${item.id}-${hashtag.id}`}
                href={buildLocalizedArticleFeedBrowsePath(locale, {
                  hashtag: hashtag.name,
                })}
                title={`${text.cards.browseHashtag}: #${hashtag.name}`}
                className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-(--text-muted) transition hover:border-(--accent) hover:text-(--text-strong)"
              >
                #{hashtag.name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-(--text-muted)">
              {text.cards.hashtagFallback}
            </span>
          </div>
        )}
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
          <span onClick={onOpenArticle}>
            <LinkButton href={articleHref} variant="ghost" size="sm" className="rounded-full px-4">
              {text.cards.openArticle}
            </LinkButton>
          </span>
        </div>
      </div>
    </article>
  );
}

export default function ArticleFeedWorkspace({
  locale,
  featureStage,
  initialFeed,
  initialBrowseMode,
  initialQuery,
  initialHashtag,
  isFeedAvailable,
  initialErrorMessage,
}: ArticleFeedWorkspaceProps) {
  const router = useRouter();
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
  const [searchInput, setSearchInput] = useState(initialQuery ?? '');
  const [hashtagSuggestions, setHashtagSuggestions] = useState<ArticleHashtag[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialFeed.items);
    setNextCursor(initialFeed.nextCursor);
    setSearchInput(initialQuery ?? '');
    setHashtagSuggestions([]);
    setSuggestionsError(null);
    setIsLoadingSuggestions(false);
    setIsLoadingMore(false);
    setLoadMoreError(null);
  }, [initialBrowseMode, initialFeed, initialHashtag, initialQuery]);

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
      const nextFeed = await loadBrowseFeedPage({
        mode: initialBrowseMode,
        cursor: nextCursor,
        query: initialQuery,
        hashtag: initialHashtag,
      });

      setItems((currentItems) => mergeFeedItems(currentItems, nextFeed.items));
      setNextCursor(nextFeed.nextCursor);
    } catch (caughtError: unknown) {
      setLoadMoreError(resolveLoadMoreErrorMessage(caughtError, text.states.loadMoreFailed));
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    initialBrowseMode,
    initialHashtag,
    initialQuery,
    isLoadingMore,
    nextCursor,
    text.states.loadMoreFailed,
  ]);

  useEffect(() => {
    const normalizedQuery = searchInput.trim();

    if (normalizedQuery.length < 2) {
      setHashtagSuggestions([]);
      setSuggestionsError(null);
      setIsLoadingSuggestions(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoadingSuggestions(true);
      setSuggestionsError(null);

      void articleApi
        .getHashtagSuggestions({
          query: normalizedQuery,
          signal: abortController.signal,
        })
        .then((response) => {
          setHashtagSuggestions(response);
        })
        .catch((caughtError: unknown) => {
          if (abortController.signal.aborted) {
            return;
          }

          setHashtagSuggestions([]);
          setSuggestionsError(resolveLoadMoreErrorMessage(caughtError, text.states.suggestionsUnavailable));
        })
        .finally(() => {
          if (abortController.signal.aborted) {
            return;
          }

          setIsLoadingSuggestions(false);
        });
    }, 220);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchInput, text.states.suggestionsUnavailable]);

  const onSubmitSearch = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      router.push(
        buildLocalizedArticleFeedBrowsePath(locale, {
          query: searchInput.trim(),
        }),
      );
    },
    [locale, router, searchInput],
  );

  const onClearFilters = useCallback(() => {
    router.push(buildLocalizedArticleFeedBrowsePath(locale));
  }, [locale, router]);

  const onApplyHashtag = useCallback(
    (hashtag: string) => {
      router.push(
        buildLocalizedArticleFeedBrowsePath(locale, {
          hashtag,
        }),
      );
    },
    [locale, router],
  );

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
  const activeFilterLabel =
    initialBrowseMode === 'search' && initialQuery !== null
      ? `${text.filters.searchingFor}: "${initialQuery}"`
      : initialBrowseMode === 'hashtag' && initialHashtag !== null
        ? `${text.filters.hashtag}: #${initialHashtag}`
        : text.filters.viewingAll;
  const emptyStateMessage =
    initialBrowseMode === 'search'
      ? text.states.searchEmpty
      : initialBrowseMode === 'hashtag'
        ? text.states.hashtagEmpty
        : text.states.empty;
  const showSuggestionPanel =
    searchInput.trim().length >= 2;

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
              <p className="text-sm font-semibold text-(--text-strong)">{activeFilterLabel}</p>
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

        <Panel className="space-y-4">
          <form
            className="flex flex-col gap-3 md:flex-row md:items-end"
            onSubmit={onSubmitSearch}
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <label
                htmlFor="article-feed-search"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)"
              >
                {text.controls.searchLabel}
              </label>
              <Input
                id="article-feed-search"
                name="article-feed-search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder={text.controls.searchPlaceholder}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">{text.controls.searchSubmit}</Button>
              {(initialBrowseMode !== 'feed' || searchInput.trim().length > 0) ? (
                <Button variant="ghost" onClick={onClearFilters}>
                  {text.controls.clearFilters}
                </Button>
              ) : null}
            </div>
          </form>

          {showSuggestionPanel ? (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
                {text.controls.suggestionsLabel}
              </p>
              {isLoadingSuggestions ? (
                <p className="text-sm text-(--text-muted)">{text.states.loadingSuggestions}</p>
              ) : suggestionsError !== null ? (
                <p className="text-sm text-rose-200">{suggestionsError}</p>
              ) : hashtagSuggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {hashtagSuggestions.map((hashtag) => (
                    <button
                      key={hashtag.id}
                      type="button"
                      onClick={() => onApplyHashtag(hashtag.name)}
                      className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-(--text-muted) transition hover:border-(--accent) hover:text-(--text-strong)"
                    >
                      #{hashtag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-(--text-muted)">{text.states.noSuggestions}</p>
              )}
            </div>
          ) : null}
        </Panel>

        {hasEmptyPublicFeed ? (
          <Panel className="space-y-3">
            <p className="text-sm text-(--text-muted)">{emptyStateMessage}</p>
          </Panel>
        ) : null}

        {canShowFeed ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <ArticleFeedCard
                key={item.id}
                item={item}
                locale={locale}
                token={token}
                text={text}
              />
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
