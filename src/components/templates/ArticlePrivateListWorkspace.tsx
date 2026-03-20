'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';
import Panel from '@/components/atoms/Panel';
import useAuthText from '@/components/organisms/auth/useAuthText';
import ElementsState from '@/components/organisms/elements/ElementsState';
import type { AuthModalMode } from '@/components/organisms/auth/AuthModal';
import { getArticlePrivateListText } from '@/components/templates/articlePrivateListText';
import AppShell from '@/components/templates/AppShell';
import { resolveSessionWorkspaceMessage } from '@/components/templates/workspaceErrorCopy';
import { articleApi, ArticleApiConfigurationError } from '@/shared/api/articleApi';
import { logoutSession } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';
import {
  buildLocalizedArticleDetailPath,
  buildLocalizedArticleEditorCreatePath,
} from '@/shared/articles/articleRouting';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type {
  ArticleCursorPage,
  ArticleStatus,
  ArticleSummary,
  ArticleVisibility,
} from '@/shared/types/article';

const AuthModal = dynamic(() => import('@/components/organisms/auth/AuthModal'));

type ArticlePrivateListWorkspaceProps = {
  locale: AppLocale;
  featureStage: ArticleFeatureStage;
};

function resolveArticleStatusLabel(
  status: ArticleStatus,
  text: ReturnType<typeof getArticlePrivateListText>,
): string {
  if (status === 'draft') {
    return text.cards.draft;
  }

  if (status === 'archived') {
    return text.cards.archived;
  }

  return text.cards.published;
}

function resolveArticleVisibilityLabel(
  visibility: ArticleVisibility,
  text: ReturnType<typeof getArticlePrivateListText>,
): string {
  return visibility === 'public' ? text.cards.publicVisibility : text.cards.privateVisibility;
}

function mergeArticleItems(
  currentItems: ArticleSummary[],
  nextItems: ArticleSummary[],
): ArticleSummary[] {
  const knownIds = new Set(currentItems.map((item) => item.id));
  return currentItems.concat(nextItems.filter((item) => !knownIds.has(item.id)));
}

function resolveArticleWorkspaceMessage(
  error: unknown,
  text: ReturnType<typeof getArticlePrivateListText>,
): string {
  if (error instanceof ArticleApiConfigurationError) {
    return text.states.unavailable;
  }

  if (error instanceof ApiError && error.statusCode === 0) {
    return text.states.loadFailedNetwork;
  }

  if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
    return text.states.signInRequired;
  }

  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return text.states.loadFailed;
}

function ArticlePrivateListCard({
  item,
  locale,
  text,
}: {
  item: ArticleSummary;
  locale: AppLocale;
  text: ReturnType<typeof getArticlePrivateListText>;
}) {
  const updatedLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(item.updatedAt));
  const authorLabel =
    item.author.displayName?.trim() ||
    item.author.username?.trim() ||
    text.cards.bylineFallback;
  const canOpenPublicArticle = item.visibility === 'public' && item.status === 'published';
  const articleHref = buildLocalizedArticleDetailPath(locale, item.slug);

  return (
    <article className="surface-panel flex h-full flex-col justify-between rounded-[2rem] border border-(--border-subtle) p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-(--border-subtle) bg-white/6 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-(--text-muted)">
            {resolveArticleStatusLabel(item.status, text)}
          </span>
          <span className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-(--text-strong)">
            {resolveArticleVisibilityLabel(item.visibility, text)}
          </span>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black leading-tight text-(--text-strong)">
            {canOpenPublicArticle ? (
              <Link href={articleHref} className="transition hover:text-(--accent)">
                {item.title.trim().length > 0 ? item.title : text.cards.untitled}
              </Link>
            ) : (
              item.title.trim().length > 0 ? item.title : text.cards.untitled
            )}
          </h2>
          <p className="text-sm leading-7 text-(--text-muted)">
            {item.excerpt.trim().length > 0 ? item.excerpt : text.cards.noExcerpt}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.hashtags.length > 0 ? (
            item.hashtags.map((hashtag) => (
              <span
                key={hashtag.id}
                className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-(--text-muted)"
              >
                #{hashtag.name}
              </span>
            ))
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-(--border-subtle) pt-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-(--text-strong)">{authorLabel}</p>
          <p className="truncate text-xs text-(--text-muted)">{updatedLabel}</p>
        </div>

        {canOpenPublicArticle ? (
          <LinkButton href={articleHref} variant="ghost" size="sm" className="rounded-full px-4">
            {text.cards.openPublicArticle}
          </LinkButton>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
            {text.cards.noPublicPage}
          </span>
        )}
      </div>
    </article>
  );
}

export default function ArticlePrivateListWorkspace({
  locale,
  featureStage,
}: ArticlePrivateListWorkspaceProps) {
  const text = getArticlePrivateListText(locale);
  const authText = useAuthText();
  const { token, isHydrated, isSilentRefreshBlocked, persistToken, removeToken } = useAuthToken();
  const authSession = useAuthSession({
    token,
    onTokenRefresh: persistToken,
    onUnauthorized: removeToken,
    allowAnonymousRefresh: isHydrated && !isSilentRefreshBlocked,
    skipTokenValidation: true,
  });
  const hasValidSession = authSession.status === 'authenticated';
  const [items, setItems] = useState<ArticleSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const resolvedSessionMessage = resolveSessionWorkspaceMessage(authSession.message, authText);
  const createDraftHref = buildLocalizedArticleEditorCreatePath(locale);

  const onLogout = useCallback(() => {
    void logoutSession().catch(() => undefined);
    removeToken({ blockSilentRefresh: true });
  }, [removeToken]);

  const openAuthModal = useCallback((mode: AuthModalMode) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const onAuthSuccess = useCallback(
    (nextToken: string) => {
      persistToken(nextToken, { clearSilentRefreshBlocked: true });
      closeAuthModal();
    },
    [closeAuthModal, persistToken],
  );

  const loadArticles = useCallback(
    async (cursor: string | null, mode: 'replace' | 'append') => {
      if (token === null) {
        return;
      }

      if (mode === 'replace') {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      setErrorMessage(null);

      try {
        const response: ArticleCursorPage<ArticleSummary> = await articleApi.listMyArticles({
          token,
          cursor,
          limit: 12,
        });

        if (mode === 'replace') {
          setItems(response.items);
        } else {
          setItems((currentItems) => mergeArticleItems(currentItems, response.items));
        }

        setNextCursor(response.nextCursor);
        setHasLoaded(true);
      } catch (caughtError: unknown) {
        setErrorMessage(resolveArticleWorkspaceMessage(caughtError, text));
      } finally {
        if (mode === 'replace') {
          setIsInitialLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    [text, token],
  );

  useEffect(() => {
    if (!hasValidSession || token === null) {
      setItems([]);
      setNextCursor(null);
      setErrorMessage(null);
      setHasLoaded(false);
      return;
    }

    void loadArticles(null, 'replace');
  }, [hasValidSession, loadArticles, token]);

  const onLoadMore = useCallback(async () => {
    if (nextCursor === null || isLoadingMore) {
      return;
    }

    await loadArticles(nextCursor, 'append');
  }, [isLoadingMore, loadArticles, nextCursor]);

  useEffect(() => {
    if (nextCursor === null || loadMoreSentinelRef.current === null || !hasValidSession) {
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
  }, [hasValidSession, nextCursor, onLoadMore]);

  const heroStyle = {
    background: [
      'radial-gradient(circle at top left, rgba(34,197,94,0.14), transparent 25%)',
      'radial-gradient(circle at 82% 18%, rgba(14,165,233,0.14), transparent 28%)',
      'linear-gradient(160deg, color-mix(in oklab, var(--surface-2) 94%, var(--background-top)), color-mix(in oklab, var(--surface-1) 88%, var(--background-base)))',
    ].join(', '),
  } as const;
  const summaryLabel = useMemo(
    () => `${items.length} ${text.stats.loadedCountLabel}`,
    [items.length, text.stats.loadedCountLabel],
  );

  if (!isHydrated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[var(--app-max-width)] items-center px-[var(--app-inline-padding)] py-6">
        <ElementsState tone="info" message={authText.workspace.loadingSession} />
      </main>
    );
  }

  return (
    <AppShell
      hasToken={hasValidSession}
      authStatus={isHydrated ? authSession.status : 'checking'}
      onLogout={onLogout}
      authEntryMode="modal"
      onRequestLogin={() => openAuthModal('login')}
      onRequestRegister={() => openAuthModal('register')}
      showFooter={false}
    >
      <div className="space-y-8 pb-10">
        <section className="relative overflow-hidden rounded-[2.6rem] px-5 py-8 shadow-[0_40px_120px_-72px_rgba(15,23,42,1)] md:px-8 md:py-10" style={heroStyle}>
          <div className="absolute inset-0 opacity-80">
            <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-300/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-(--text-muted)">
                Article System
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
              <LinkButton href={createDraftHref} variant="primary" size="sm" className="rounded-full px-4">
                {text.createDraft}
              </LinkButton>
              <span className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-(--text-strong)">
                {summaryLabel}
              </span>
            </div>
          </div>
        </section>

        {authSession.status === 'checking' ? (
          <ElementsState tone="info" message={authText.workspace.checkingSession} />
        ) : authSession.status === 'unverified' ? (
          <ElementsState
            tone="error"
            message={resolvedSessionMessage}
            actionLabel={authText.common.tryAgain}
            onAction={authSession.revalidate}
          />
        ) : !hasValidSession ? (
          <ElementsState
            tone="info"
            message={text.states.signInRequired}
            actionLabel={authText.common.openLogin}
            onAction={() => openAuthModal('login')}
          />
        ) : isInitialLoading && !hasLoaded ? (
          <ElementsState tone="info" message={text.states.loading} showProgress />
        ) : errorMessage !== null ? (
          <ElementsState
            tone="error"
            message={errorMessage}
            actionLabel={authText.common.tryAgain}
            onAction={() => void loadArticles(null, 'replace')}
          />
        ) : hasLoaded && items.length === 0 ? (
          <Panel className="space-y-3">
            <p className="text-sm text-(--text-muted)">{text.states.empty}</p>
            <div>
              <LinkButton href={createDraftHref} variant="secondary" size="sm" className="rounded-full px-4">
                {text.states.createFirstDraft}
              </LinkButton>
            </div>
          </Panel>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-2">
              {items.map((item) => (
                <ArticlePrivateListCard key={item.id} item={item} locale={locale} text={text} />
              ))}
            </section>

            {nextCursor !== null ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div ref={loadMoreSentinelRef} aria-hidden="true" className="h-2 w-full" />
                {isLoadingMore ? (
                  <p className="text-sm text-(--text-muted)">{text.states.loadingMore}</p>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-4"
                    onClick={() => void onLoadMore()}
                  >
                    {text.states.loadMore}
                  </Button>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authModalMode}
        onClose={closeAuthModal}
        onSuccess={onAuthSuccess}
      />
    </AppShell>
  );
}
