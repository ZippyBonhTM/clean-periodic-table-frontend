'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Button from '@/components/atoms/Button';
import LinkButton from '@/components/atoms/LinkButton';
import MarkdownContent from '@/components/atoms/MarkdownContent';
import Panel from '@/components/atoms/Panel';
import useAuthText from '@/components/organisms/auth/useAuthText';
import ElementsState from '@/components/organisms/elements/ElementsState';
import type { AuthModalMode } from '@/components/organisms/auth/AuthModal';
import AppShell from '@/components/templates/AppShell';
import { getArticleEditorText } from '@/components/templates/articleEditorText';
import { resolveSessionWorkspaceMessage } from '@/components/templates/workspaceErrorCopy';
import { articleApi, ArticleApiConfigurationError } from '@/shared/api/articleApi';
import { logoutSession } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/httpClient';
import {
  buildArticleSlugPreview,
  parseArticleHashtags,
} from '@/shared/articles/articleEditorUtils';
import {
  buildLocalizedArticleEditorPath,
  buildLocalizedArticlePrivateListPath,
} from '@/shared/articles/articleRouting';
import type { ArticleFeatureStage } from '@/shared/config/articleFeature';
import useAuthSession from '@/shared/hooks/useAuthSession';
import useAuthToken from '@/shared/hooks/useAuthToken';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import type { ArticleDetail, ArticleStatus, ArticleVisibility } from '@/shared/types/article';

const AuthModal = dynamic(() => import('@/components/organisms/auth/AuthModal'));

type ArticleEditorWorkspaceProps = {
  locale: AppLocale;
  featureStage: ArticleFeatureStage;
  articleId?: string;
};

function resolveSaveErrorMessage(
  error: unknown,
  text: ReturnType<typeof getArticleEditorText>,
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

function resolveLoadErrorMessage(
  error: unknown,
  text: ReturnType<typeof getArticleEditorText>,
): string {
  if (error instanceof ArticleApiConfigurationError) {
    return text.notices.unavailable;
  }

  if (error instanceof ApiError && error.statusCode === 0) {
    return text.notices.loadFailedNetwork;
  }

  if (error instanceof ApiError && error.statusCode === 404) {
    return text.notices.loadNotFound;
  }

  if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
    return text.notices.loadForbidden;
  }

  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return text.notices.loadFailed;
}

function resolveStatusLabel(
  status: ArticleStatus,
  text: ReturnType<typeof getArticleEditorText>,
): string {
  if (status === 'published') {
    return text.meta.published;
  }

  if (status === 'archived') {
    return text.meta.archived;
  }

  return text.meta.draft;
}

export default function ArticleEditorWorkspace({
  locale,
  featureStage,
  articleId,
}: ArticleEditorWorkspaceProps) {
  const router = useRouter();
  const text = getArticleEditorText(locale);
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
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [markdownSource, setMarkdownSource] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [visibility, setVisibility] = useState<ArticleVisibility>('private');
  const [savedArticle, setSavedArticle] = useState<ArticleDetail | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(articleId !== undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const resolvedSessionMessage = resolveSessionWorkspaceMessage(authSession.message, authText);
  const workspaceHref = buildLocalizedArticlePrivateListPath(locale);

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

  const applyLoadedArticle = useCallback((article: ArticleDetail) => {
    setSavedArticle(article);
    setTitle(article.title);
    setExcerpt(article.excerpt);
    setMarkdownSource(article.markdownSource);
    setVisibility(article.visibility);
    setHashtagsInput(article.hashtags.map((hashtag) => `#${hashtag.name}`).join(', '));
  }, []);

  useEffect(() => {
    if (articleId === undefined) {
      setIsLoadingArticle(false);
      setLoadError(null);
      return;
    }

    if (!hasValidSession || token === null) {
      setIsLoadingArticle(false);
      return;
    }

    let isCancelled = false;

    setIsLoadingArticle(true);
    setLoadError(null);
    setSaveError(null);
    setSaveSuccess(null);
    setSavedArticle(null);
    setTitle('');
    setExcerpt('');
    setMarkdownSource('');
    setHashtagsInput('');
    setVisibility('private');

    void articleApi
      .getMyArticleById({
        articleId,
        token,
      })
      .then((response) => {
        if (isCancelled) {
          return;
        }

        applyLoadedArticle(response);
      })
      .catch((caughtError: unknown) => {
        if (isCancelled) {
          return;
        }

        setSavedArticle(null);
        setLoadError(resolveLoadErrorMessage(caughtError, text));
      })
      .finally(() => {
        if (isCancelled) {
          return;
        }

        setIsLoadingArticle(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [applyLoadedArticle, articleId, hasValidSession, loadAttempt, text, token]);

  const hashtagList = useMemo(() => parseArticleHashtags(hashtagsInput), [hashtagsInput]);
  const slugPreview = useMemo(() => buildArticleSlugPreview(title), [title]);
  const renderedPreview = markdownSource.trim().length > 0 ? markdownSource : null;
  const lastSavedLabel = useMemo(() => {
    if (savedArticle === null) {
      return text.meta.unsaved;
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(savedArticle.updatedAt));
  }, [locale, savedArticle, text.meta.unsaved]);

  const onRetryLoad = useCallback(() => {
    setLoadAttempt((currentValue) => currentValue + 1);
  }, []);

  const onSaveDraft = useCallback(async () => {
    if (token === null) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const isCreatingDraft = savedArticle === null;
      const response =
        savedArticle === null
          ? await articleApi.createDraft({
              token,
              title,
              markdownSource,
              excerpt,
              visibility,
              hashtags: hashtagList,
            })
          : await articleApi.updateArticle({
              articleId: savedArticle.id,
              token,
              title,
              markdownSource,
              excerpt,
              visibility,
              hashtags: hashtagList,
            });

      applyLoadedArticle(response);
      setSaveSuccess(text.notices.saveSucceeded);

      if (isCreatingDraft) {
        router.replace(buildLocalizedArticleEditorPath(locale, response.id));
      }
    } catch (caughtError: unknown) {
      setSaveError(resolveSaveErrorMessage(caughtError, text));
    } finally {
      setIsSaving(false);
    }
  }, [
    applyLoadedArticle,
    excerpt,
    hashtagList,
    locale,
    markdownSource,
    router,
    savedArticle,
    text,
    title,
    token,
    visibility,
  ]);

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
        <section
          className="relative overflow-hidden rounded-[2.6rem] px-5 py-8 shadow-[0_40px_120px_-72px_rgba(15,23,42,1)] md:px-8 md:py-10"
          style={{
            background: [
              'radial-gradient(circle at top left, rgba(251,191,36,0.14), transparent 24%)',
              'radial-gradient(circle at 82% 18%, rgba(14,165,233,0.16), transparent 28%)',
              'linear-gradient(160deg, color-mix(in oklab, var(--surface-2) 94%, var(--background-top)), color-mix(in oklab, var(--surface-1) 88%, var(--background-base)))',
            ].join(', '),
          }}
        >
          <div className="absolute inset-0 opacity-80">
            <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-300/10 blur-3xl" />
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
              <LinkButton href={workspaceHref} variant="secondary" size="sm" className="rounded-full px-4">
                {text.actions.openWorkspace}
              </LinkButton>
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
            message={text.notices.signInRequired}
            actionLabel={authText.common.openLogin}
            onAction={() => openAuthModal('login')}
          />
        ) : articleId !== undefined && isLoadingArticle && savedArticle === null ? (
          <ElementsState tone="info" message={text.notices.loadingArticle} showProgress />
        ) : articleId !== undefined && loadError !== null && savedArticle === null ? (
          <ElementsState
            tone="error"
            message={loadError}
            actionLabel={authText.common.tryAgain}
            onAction={onRetryLoad}
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
            <section className="space-y-6">
              <Panel className="space-y-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="article-editor-title"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)"
                  >
                    {text.form.titleLabel}
                  </label>
                  <input
                    id="article-editor-title"
                    name="article-editor-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={text.form.titlePlaceholder}
                    className="w-full rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-soft) px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-(--accent)"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="article-editor-excerpt"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)"
                  >
                    {text.form.excerptLabel}
                  </label>
                  <textarea
                    id="article-editor-excerpt"
                    name="article-editor-excerpt"
                    value={excerpt}
                    onChange={(event) => setExcerpt(event.target.value)}
                    placeholder={text.form.excerptPlaceholder}
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-soft) px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-(--accent)"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="article-editor-hashtags"
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)"
                    >
                      {text.form.hashtagsLabel}
                    </label>
                    <input
                      id="article-editor-hashtags"
                      name="article-editor-hashtags"
                      type="text"
                      value={hashtagsInput}
                      onChange={(event) => setHashtagsInput(event.target.value)}
                      placeholder={text.form.hashtagsPlaceholder}
                      className="w-full rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-soft) px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-(--accent)"
                    />
                    <p className="text-xs leading-relaxed text-(--text-muted)">
                      {text.form.hashtagsHint}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="article-editor-visibility"
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)"
                    >
                      {text.form.visibilityLabel}
                    </label>
                    <select
                      id="article-editor-visibility"
                      name="article-editor-visibility"
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value as ArticleVisibility)}
                      className="w-full rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-soft) px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-(--accent)"
                    >
                      <option value="private">{text.form.visibilityPrivate}</option>
                      <option value="public">{text.form.visibilityPublic}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="article-editor-markdown"
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)"
                  >
                    {text.form.markdownLabel}
                  </label>
                  <textarea
                    id="article-editor-markdown"
                    name="article-editor-markdown"
                    value={markdownSource}
                    onChange={(event) => setMarkdownSource(event.target.value)}
                    placeholder={text.form.markdownPlaceholder}
                    rows={16}
                    spellCheck={false}
                    className="notranslate min-h-80 w-full rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-soft) px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors focus:border-(--accent)"
                  />
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

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void onSaveDraft()} disabled={isSaving || isLoadingArticle}>
                    {isSaving ? text.actions.savingDraft : text.actions.saveDraft}
                  </Button>
                </div>
              </Panel>
            </section>

            <aside className="space-y-6">
              <Panel className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-(--text-muted)">
                  {text.form.slugPreviewLabel}
                </p>
                <p className="break-all text-sm font-semibold text-(--text-strong)">{slugPreview}</p>
              </Panel>

              <Panel className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-(--text-muted)">
                  {text.meta.currentStatus}
                </p>
                <p className="text-sm font-semibold text-(--text-strong)">
                  {savedArticle === null ? text.meta.draft : resolveStatusLabel(savedArticle.status, text)}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-(--text-muted)">
                  {text.meta.currentSlug}
                </p>
                <p className="break-all text-sm text-(--text-strong)">
                  {savedArticle?.slug ?? slugPreview}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-(--text-muted)">
                  {text.meta.lastSaved}
                </p>
                <p className="text-sm text-(--text-muted)">{lastSavedLabel}</p>
              </Panel>

              <Panel className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-(--text-muted)">
                  {text.form.hashtagsLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {hashtagList.length > 0 ? (
                    hashtagList.map((hashtag) => (
                      <span
                        key={hashtag}
                        className="inline-flex rounded-full border border-(--border-subtle) bg-(--surface-overlay-soft) px-3 py-1 text-xs font-semibold text-(--text-muted)"
                      >
                        #{hashtag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-(--text-muted)">#draft</span>
                  )}
                </div>
              </Panel>

              <Panel className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-(--text-muted)">
                  {text.form.previewLabel}
                </p>
                {renderedPreview !== null ? (
                  <MarkdownContent
                    content={renderedPreview}
                    className="space-y-4 text-sm leading-7 text-(--text-strong)"
                  />
                ) : (
                  <p className="text-sm text-(--text-muted)">{text.notices.emptyPreview}</p>
                )}
              </Panel>
            </aside>
          </div>
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
