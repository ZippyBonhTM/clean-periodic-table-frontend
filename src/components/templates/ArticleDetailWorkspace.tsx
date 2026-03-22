'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';
import MarkdownContent from '@/components/atoms/MarkdownContent';
import Panel from '@/components/atoms/Panel';
import type { AuthModalMode } from '@/components/organisms/auth/AuthModal';
import { articleApi, ArticleApiConfigurationError } from '@/shared/api/articleApi';
import { ApiError } from '@/shared/api/httpClient';
import {
  buildLocalizedArticleFeedBrowsePath,
  buildLocalizedArticleFeedPath,
} from '@/shared/articles/articleRouting';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import type { ArticleDetail, ArticleStatus } from '@/shared/types/article';
import { logoutSession } from '@/shared/api/authApi';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

import AppShell from './AppShell';
import { getArticleDetailText } from './articleDetailText';

const AuthModal = dynamic(() => import('@/components/organisms/auth/AuthModal'));

type ArticleDetailWorkspaceProps = {
  locale: AppLocale;
  featureStage: ArticleFeatureStage;
  article: ArticleDetail | null;
  isAvailable: boolean;
  initialErrorMessage: string | null;
};

type ArticleSaveActionState = {
  articleId: string | null;
  status: 'idle' | 'saving' | 'saved';
  error: string | null;
  success: string | null;
};

type ArticleCopyLinkState = 'idle' | 'copying' | 'copied';
type ArticleCopyLinkActionState = {
  articleId: string | null;
  status: ArticleCopyLinkState;
  error: string | null;
};

function resolveSaveActionErrorMessage(
  error: unknown,
  text: ReturnType<typeof getArticleDetailText>,
): string {
  if (error instanceof ArticleApiConfigurationError) {
    return text.notices.unavailable;
  }

  if (error instanceof ApiError && error.statusCode === 0) {
    return text.notices.saveFailedNetwork;
  }

  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return text.notices.saveFailed;
}

function resolveStatusLabel(status: ArticleStatus, text: ReturnType<typeof getArticleDetailText>): string {
  if (status === 'draft') {
    return text.status.draft;
  }

  if (status === 'archived') {
    return text.status.archived;
  }

  return text.status.published;
}

async function copyArticleLinkToClipboard(value: string): Promise<void> {
  if (navigator.clipboard !== undefined && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const didCopy = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!didCopy) {
    throw new Error('ARTICLE_COPY_LINK_FAILED');
  }
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
  const pendingSaveAfterAuthArticleIdRef = useRef<string | null>(null);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [saveActionState, setSaveActionState] = useState<ArticleSaveActionState>({
    articleId: null,
    status: 'idle',
    error: null,
    success: null,
  });
  const [copyLinkActionState, setCopyLinkActionState] = useState<ArticleCopyLinkActionState>({
    articleId: null,
    status: 'idle',
    error: null,
  });
  const activeArticleId = article?.id ?? null;
  const saveState =
    saveActionState.articleId === activeArticleId ? saveActionState.status : 'idle';
  const saveError =
    saveActionState.articleId === activeArticleId ? saveActionState.error : null;
  const saveSuccess =
    saveActionState.articleId === activeArticleId ? saveActionState.success : null;
  const copyState =
    copyLinkActionState.articleId === activeArticleId ? copyLinkActionState.status : 'idle';
  const copyError =
    copyLinkActionState.articleId === activeArticleId ? copyLinkActionState.error : null;

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

  useEffect(() => {
    if (copyState !== 'copied' || activeArticleId === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyLinkActionState((currentState) =>
        currentState.articleId !== activeArticleId
          ? currentState
          : {
              articleId: activeArticleId,
              status: 'idle',
              error: null,
            },
      );
    }, 2_400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeArticleId, copyState]);

  const performSaveArticle = useCallback(
    async (activeToken: string) => {
      if (article === null) {
        return;
      }

      setSaveActionState({
        articleId: article.id,
        status: 'saving',
        error: null,
        success: null,
      });

      try {
        await articleApi.saveArticle({
          articleId: article.id,
          token: activeToken,
        });

        setSaveActionState({
          articleId: article.id,
          status: 'saved',
          error: null,
          success: text.notices.saveSucceeded,
        });
      } catch (caughtError: unknown) {
        setSaveActionState({
          articleId: article.id,
          status: 'idle',
          error: resolveSaveActionErrorMessage(caughtError, text),
          success: null,
        });
      }
    },
    [article, text],
  );

  const onAuthSuccess = useCallback(
    (nextToken: string) => {
      persistToken(nextToken, { clearSilentRefreshBlocked: true });
      closeAuthModal();

      if (article !== null && pendingSaveAfterAuthArticleIdRef.current === article.id) {
        pendingSaveAfterAuthArticleIdRef.current = null;
        void performSaveArticle(nextToken);
      }
    },
    [article, closeAuthModal, performSaveArticle, persistToken],
  );

  const onSaveArticle = useCallback(() => {
    if (article === null || saveState === 'saving' || saveState === 'saved') {
      return;
    }

    if (authSession.status !== 'authenticated' || token === null) {
      pendingSaveAfterAuthArticleIdRef.current = article.id;
      setSaveActionState({
        articleId: article.id,
        status: 'idle',
        error: null,
        success: null,
      });
      openAuthModal('login');
      return;
    }

    void performSaveArticle(token);
  }, [article, authSession.status, openAuthModal, performSaveArticle, saveState, token]);

  const onCopyArticleLink = useCallback(async () => {
    if (article === null || copyState === 'copying') {
      return;
    }

    setCopyLinkActionState({
      articleId: article.id,
      status: 'copying',
      error: null,
    });

    try {
      await copyArticleLinkToClipboard(window.location.href);
      setCopyLinkActionState({
        articleId: article.id,
        status: 'copied',
        error: null,
      });
    } catch {
      setCopyLinkActionState({
        articleId: article.id,
        status: 'idle',
        error: text.notices.copyLinkFailed,
      });
    }
  }, [article, copyState, text.notices.copyLinkFailed]);

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
              <Button
                variant={saveState === 'saved' ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => void onSaveArticle()}
                disabled={authSession.status === 'checking' || saveState === 'saving' || saveState === 'saved'}
                className="rounded-full px-4"
              >
                {saveState === 'saving'
                  ? text.actions.savingArticle
                  : saveState === 'saved'
                    ? text.actions.savedArticle
                    : text.actions.saveArticle}
              </Button>
              <Button
                variant={copyState === 'copied' ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => void onCopyArticleLink()}
                disabled={copyState === 'copying'}
                className="rounded-full px-4"
              >
                {copyState === 'copying'
                  ? text.actions.copyingLink
                  : copyState === 'copied'
                    ? text.actions.copiedLink
                    : text.actions.copyLink}
              </Button>
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

            {saveError !== null ? (
              <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {saveError}
              </p>
            ) : null}

            {saveSuccess !== null ? (
              <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                {saveSuccess}
              </p>
            ) : null}

            {copyError !== null ? (
              <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {copyError}
              </p>
            ) : null}

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
                    <Link
                      key={hashtag.id}
                      href={buildLocalizedArticleFeedBrowsePath(locale, {
                        hashtag: hashtag.name,
                      })}
                      title={`${text.meta.browseHashtag}: #${hashtag.name}`}
                      className="inline-flex rounded-full border border-(--border-subtle) bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-(--text-muted) transition hover:border-(--accent) hover:text-(--text-strong)"
                    >
                      #{hashtag.name}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-(--text-muted)">{text.meta.noHashtags}</span>
                )}
              </div>
            </Panel>
          </aside>
        </div>
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
