'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';

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
  ARTICLE_IMAGE_UPLOAD_ACCEPTED_MIME_TYPES,
  buildArticleSlugPreview,
  buildArticleImageMarkdown,
  hasArticleEditorChanges,
  parseArticleHashtags,
  validateArticleImageFile,
  validateArticlePublishInput,
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
const ARTICLE_EDITOR_AUTOSAVE_DELAY_MS = 45_000;

type ArticleEditorWorkspaceProps = {
  locale: AppLocale;
  featureStage: ArticleFeatureStage;
  articleId?: string;
};

function resolveMutationErrorMessage(
  error: unknown,
  text: ReturnType<typeof getArticleEditorText>,
  fallbackMessage: string,
  networkMessage: string,
): string {
  if (error instanceof ArticleApiConfigurationError) {
    return text.notices.unavailable;
  }

  if (error instanceof ApiError && error.statusCode === 0) {
    return networkMessage;
  }

  if (error instanceof ApiError && error.message.trim().length > 0) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
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

function resolvePublishValidationMessage(
  text: ReturnType<typeof getArticleEditorText>,
  input: {
    articleId?: string;
    title: string;
    markdownSource: string;
  },
): string | null {
  if (input.articleId === undefined) {
    return text.notices.saveBeforePublish;
  }

  const validationCode = validateArticlePublishInput({
    title: input.title,
    markdownSource: input.markdownSource,
  });

  if (validationCode === 'missing_title') {
    return text.notices.publishNeedsTitle;
  }

  if (validationCode === 'missing_markdown') {
    return text.notices.publishNeedsMarkdown;
  }

  return null;
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
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [markdownSource, setMarkdownSource] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [visibility, setVisibility] = useState<ArticleVisibility>('private');
  const [savedArticle, setSavedArticle] = useState<ArticleDetail | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(articleId !== undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [activeMutation, setActiveMutation] = useState<
    'save' | 'autosave' | 'upload' | 'upload-cover' | 'publish' | 'unpublish' | 'delete' | null
  >(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);
  const [autosaveState, setAutosaveState] = useState<
    'idle' | 'scheduled' | 'saving' | 'saved' | 'failed' | 'disabled'
  >('idle');
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);
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
    setCoverImage(article.coverImage);
    setMarkdownSource(article.markdownSource);
    setVisibility(article.visibility);
    setHashtagsInput(article.hashtags.map((hashtag) => `#${hashtag.name}`).join(', '));
    setIsDeleteConfirmationVisible(false);
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
    setFeedbackError(null);
    setFeedbackSuccess(null);
    setAutosaveState('idle');
    setAutosaveError(null);
    setSavedArticle(null);
    setTitle('');
    setExcerpt('');
    setCoverImage(null);
    setMarkdownSource('');
    setHashtagsInput('');
    setVisibility('private');
    setIsDeleteConfirmationVisible(false);

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
  const currentDraftSnapshot = useMemo(
    () => ({
      title,
      excerpt,
      coverImage,
      markdownSource,
      visibility,
      hashtags: hashtagList,
    }),
    [coverImage, excerpt, hashtagList, markdownSource, title, visibility],
  );
  const savedDraftSnapshot = useMemo(
    () =>
      savedArticle === null
        ? null
        : {
            title: savedArticle.title,
            excerpt: savedArticle.excerpt,
            coverImage: savedArticle.coverImage,
            markdownSource: savedArticle.markdownSource,
            visibility: savedArticle.visibility,
            hashtags: savedArticle.hashtags.map((hashtag) => hashtag.name),
          },
    [savedArticle],
  );
  const hasUnsavedChanges = useMemo(
    () => hasArticleEditorChanges(currentDraftSnapshot, savedDraftSnapshot),
    [currentDraftSnapshot, savedDraftSnapshot],
  );
  const publishValidationMessage = useMemo(
    () =>
      resolvePublishValidationMessage(text, {
        articleId: savedArticle?.id,
        title,
        markdownSource,
      }),
    [markdownSource, savedArticle?.id, text, title],
  );
  const canPublish =
    savedArticle !== null &&
    savedArticle.status !== 'published' &&
    publishValidationMessage === null;
  const autosaveDisabled = savedArticle?.status === 'published';
  const autosaveStatusLabel = useMemo(() => {
    if (autosaveDisabled) {
      return text.meta.autosaveDisabledPublished;
    }

    if (autosaveState === 'scheduled') {
      return text.meta.autosavePending;
    }

    if (autosaveState === 'saving') {
      return text.meta.autosaveSaving;
    }

    if (autosaveState === 'saved') {
      return text.meta.autosaveSaved;
    }

    if (autosaveState === 'failed' && autosaveError !== null) {
      return autosaveError;
    }

    return text.meta.autosaveIdle;
  }, [autosaveDisabled, autosaveError, autosaveState, text.meta]);
  const lastSavedLabel = useMemo(() => {
    if (savedArticle === null) {
      return text.meta.unsaved;
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(savedArticle.updatedAt));
  }, [locale, savedArticle, text.meta.unsaved]);
  const deleteConfirmationMessage =
    savedArticle?.status === 'published'
      ? text.notices.deleteConfirmPublished
      : text.notices.deleteConfirmDraft;

  const onRetryLoad = useCallback(() => {
    setLoadAttempt((currentValue) => currentValue + 1);
  }, []);

  const performSave = useCallback(async (origin: 'manual' | 'autosave') => {
    if (token === null) {
      return;
    }

    setActiveMutation(origin === 'autosave' ? 'autosave' : 'save');

    if (origin === 'manual') {
      setFeedbackError(null);
      setFeedbackSuccess(null);
    } else {
      setAutosaveError(null);
      setAutosaveState('saving');
    }

    try {
      const isCreatingDraft = savedArticle === null;
      const response =
        savedArticle === null
          ? await articleApi.createDraft({
              token,
              title,
              markdownSource,
              excerpt,
              coverImage,
              visibility,
              hashtags: hashtagList,
            })
          : await articleApi.updateArticle({
              articleId: savedArticle.id,
              token,
              title,
              markdownSource,
              excerpt,
              coverImage,
              visibility,
              hashtags: hashtagList,
            });

      applyLoadedArticle(response);

      if (origin === 'manual') {
        setFeedbackSuccess(text.notices.saveSucceeded);
      } else {
        setAutosaveState('saved');
        setAutosaveError(null);
      }

      if (isCreatingDraft) {
        router.replace(buildLocalizedArticleEditorPath(locale, response.id));
      }
    } catch (caughtError: unknown) {
      if (origin === 'manual') {
        setFeedbackError(
          resolveMutationErrorMessage(
            caughtError,
            text,
            text.notices.saveFailed,
            text.notices.saveFailedNetwork,
          ),
        );
      } else {
        setAutosaveError(
          resolveMutationErrorMessage(
            caughtError,
            text,
            text.notices.autosaveFailed,
            text.notices.autosaveFailedNetwork,
          ),
        );
        setAutosaveState('failed');
      }
    } finally {
      setActiveMutation(null);
    }
  }, [
    applyLoadedArticle,
    coverImage,
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

  const onSaveDraft = useCallback(async () => {
    await performSave('manual');
  }, [performSave]);

  const onRequestImageUpload = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const onRequestCoverImageUpload = useCallback(() => {
    coverImageInputRef.current?.click();
  }, []);

  const onClearCoverImage = useCallback(() => {
    setCoverImage(null);
    setFeedbackError(null);
    setFeedbackSuccess(text.notices.coverCleared);
  }, [text.notices.coverCleared]);

  const onRequestDeleteArticle = useCallback(() => {
    setFeedbackError(null);
    setFeedbackSuccess(null);
    setIsDeleteConfirmationVisible(true);
  }, []);

  const onCancelDeleteArticle = useCallback(() => {
    setIsDeleteConfirmationVisible(false);
  }, []);

  const onImageFileSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0] ?? null;
      event.target.value = '';

      if (selectedFile === null || token === null) {
        return;
      }

      const validationCode = validateArticleImageFile({
        type: selectedFile.type,
        size: selectedFile.size,
      });

      if (validationCode !== null) {
        setFeedbackSuccess(null);
        setFeedbackError(
          validationCode === 'invalid_type'
            ? text.notices.uploadInvalidType
            : text.notices.uploadTooLarge,
        );
        return;
      }

      setActiveMutation('upload');
      setFeedbackError(null);
      setFeedbackSuccess(null);

      try {
        const response = await articleApi.uploadImage({
          token,
          file: selectedFile,
        });

        const imageMarkdown = buildArticleImageMarkdown(selectedFile.name, response.fileUrl);

        setMarkdownSource((currentValue) => {
          const trimmedValue = currentValue.replace(/\s+$/g, '');

          if (trimmedValue.length === 0) {
            return imageMarkdown;
          }

          return `${trimmedValue}\n\n${imageMarkdown}`;
        });
        setFeedbackSuccess(text.notices.uploadSucceeded);
      } catch (caughtError: unknown) {
        setFeedbackError(
          resolveMutationErrorMessage(
            caughtError,
            text,
            text.notices.uploadFailed,
            text.notices.uploadFailedNetwork,
          ),
        );
      } finally {
        setActiveMutation(null);
      }
    },
    [text, token],
  );

  const onCoverImageFileSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0] ?? null;
      event.target.value = '';

      if (selectedFile === null || token === null) {
        return;
      }

      const validationCode = validateArticleImageFile({
        type: selectedFile.type,
        size: selectedFile.size,
      });

      if (validationCode !== null) {
        setFeedbackSuccess(null);
        setFeedbackError(
          validationCode === 'invalid_type'
            ? text.notices.uploadInvalidType
            : text.notices.uploadTooLarge,
        );
        return;
      }

      setActiveMutation('upload-cover');
      setFeedbackError(null);
      setFeedbackSuccess(null);

      try {
        const response = await articleApi.uploadImage({
          token,
          file: selectedFile,
        });

        setCoverImage(response.fileUrl);
        setFeedbackSuccess(text.notices.coverUploadSucceeded);
      } catch (caughtError: unknown) {
        setFeedbackError(
          resolveMutationErrorMessage(
            caughtError,
            text,
            text.notices.uploadFailed,
            text.notices.uploadFailedNetwork,
          ),
        );
      } finally {
        setActiveMutation(null);
      }
    },
    [text, token],
  );

  useEffect(() => {
    if (!hasValidSession || token === null || isLoadingArticle || loadError !== null) {
      return;
    }

    if (autosaveDisabled) {
      setAutosaveState('disabled');
      setAutosaveError(null);
      return;
    }

    if (!hasUnsavedChanges) {
      setAutosaveError(null);
      setAutosaveState((currentValue) =>
        currentValue === 'saved' ? currentValue : 'idle',
      );
      return;
    }

    if (activeMutation !== null) {
      return;
    }

    setAutosaveState((currentValue) =>
      currentValue === 'failed' ? currentValue : 'scheduled',
    );

    const timeoutId = window.setTimeout(() => {
      void performSave('autosave');
    }, ARTICLE_EDITOR_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activeMutation,
    autosaveDisabled,
    hasUnsavedChanges,
    hasValidSession,
    isLoadingArticle,
    loadError,
    performSave,
    token,
  ]);

  const onPublishArticle = useCallback(async () => {
    if (token === null || savedArticle === null) {
      return;
    }

    if (publishValidationMessage !== null) {
      setFeedbackError(publishValidationMessage);
      setFeedbackSuccess(null);
      return;
    }

    setActiveMutation('publish');
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const response = await articleApi.publishArticle({
        articleId: savedArticle.id,
        token,
      });

      applyLoadedArticle(response);
      setFeedbackSuccess(text.notices.publishSucceeded);
    } catch (caughtError: unknown) {
      setFeedbackError(
        resolveMutationErrorMessage(
          caughtError,
          text,
          text.notices.publishFailed,
          text.notices.publishFailedNetwork,
        ),
      );
    } finally {
      setActiveMutation(null);
    }
  }, [applyLoadedArticle, publishValidationMessage, savedArticle, text, token]);

  const onUnpublishArticle = useCallback(async () => {
    if (token === null || savedArticle === null) {
      return;
    }

    setActiveMutation('unpublish');
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const response = await articleApi.unpublishArticle({
        articleId: savedArticle.id,
        token,
      });

      applyLoadedArticle(response);
      setFeedbackSuccess(text.notices.unpublishSucceeded);
    } catch (caughtError: unknown) {
      setFeedbackError(
        resolveMutationErrorMessage(
          caughtError,
          text,
          text.notices.unpublishFailed,
          text.notices.unpublishFailedNetwork,
        ),
      );
    } finally {
      setActiveMutation(null);
    }
  }, [applyLoadedArticle, savedArticle, text, token]);

  const onDeleteArticle = useCallback(async () => {
    if (token === null || savedArticle === null) {
      return;
    }

    setActiveMutation('delete');
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      await articleApi.deleteArticle({
        articleId: savedArticle.id,
        token,
      });

      setIsDeleteConfirmationVisible(false);
      router.replace(workspaceHref);
    } catch (caughtError: unknown) {
      setFeedbackError(
        resolveMutationErrorMessage(
          caughtError,
          text,
          text.notices.deleteFailed,
          text.notices.deleteFailedNetwork,
        ),
      );
    } finally {
      setActiveMutation(null);
    }
  }, [router, savedArticle, text, token, workspaceHref]);

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

                <div className="space-y-3 rounded-[1.6rem] border border-(--border-subtle) bg-(--surface-overlay-soft) p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
                        {text.form.coverImageLabel}
                      </p>
                      <p className="text-xs leading-relaxed text-(--text-muted)">
                        {text.form.coverImageHint}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRequestCoverImageUpload}
                        disabled={activeMutation !== null || isLoadingArticle}
                      >
                        {activeMutation === 'upload-cover'
                          ? text.actions.uploadingCoverImage
                          : text.actions.uploadCoverImage}
                      </Button>
                      {coverImage !== null ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onClearCoverImage}
                          disabled={activeMutation !== null || isLoadingArticle}
                        >
                          {text.actions.clearCoverImage}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <input
                    ref={coverImageInputRef}
                    id="article-editor-cover-image-upload"
                    name="article-editor-cover-image-upload"
                    type="file"
                    accept={ARTICLE_IMAGE_UPLOAD_ACCEPTED_MIME_TYPES.join(',')}
                    className="hidden"
                    onChange={(event) => {
                      void onCoverImageFileSelected(event);
                    }}
                  />
                  {coverImage !== null ? (
                    <div className="overflow-hidden rounded-[1.4rem] border border-(--border-subtle) bg-[var(--surface-2)]">
                      {/* Cover URLs come from runtime storage/CDN configuration, so we render them directly here. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage}
                        alt={title.trim().length > 0 ? title : text.form.coverImageLabel}
                        className="h-56 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-(--text-muted)">{text.form.coverImageEmpty}</p>
                  )}
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
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label
                      htmlFor="article-editor-image-upload"
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)"
                    >
                      {text.form.imageUploadLabel}
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRequestImageUpload}
                      disabled={activeMutation !== null || isLoadingArticle}
                    >
                      {activeMutation === 'upload'
                        ? text.actions.uploadingImage
                        : text.actions.uploadImage}
                    </Button>
                  </div>
                  <input
                    ref={imageInputRef}
                    id="article-editor-image-upload"
                    name="article-editor-image-upload"
                    type="file"
                    accept={ARTICLE_IMAGE_UPLOAD_ACCEPTED_MIME_TYPES.join(',')}
                    className="hidden"
                    onChange={(event) => {
                      void onImageFileSelected(event);
                    }}
                  />
                  <p className="text-xs leading-relaxed text-(--text-muted)">
                    {text.form.imageUploadHint}
                  </p>
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

                {feedbackError !== null ? (
                  <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {feedbackError}
                  </p>
                ) : null}

                {feedbackSuccess !== null ? (
                  <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                    {feedbackSuccess}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => void onSaveDraft()}
                    disabled={activeMutation !== null || isLoadingArticle}
                  >
                    {activeMutation === 'save' || activeMutation === 'autosave'
                      ? text.actions.savingDraft
                      : text.actions.saveDraft}
                  </Button>

                  {savedArticle?.status === 'published' ? (
                    <Button
                      variant="ghost"
                      onClick={() => void onUnpublishArticle()}
                      disabled={activeMutation !== null || isLoadingArticle}
                    >
                      {activeMutation === 'unpublish'
                        ? text.actions.unpublishing
                        : text.actions.unpublish}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => void onPublishArticle()}
                      disabled={!canPublish || activeMutation !== null || isLoadingArticle}
                    >
                      {activeMutation === 'publish' ? text.actions.publishing : text.actions.publish}
                    </Button>
                  )}

                  {savedArticle !== null ? (
                    <Button
                      variant="ghost"
                      onClick={onRequestDeleteArticle}
                      disabled={activeMutation !== null || isLoadingArticle}
                      className="border-rose-400/40 bg-rose-500/10 text-rose-100 hover:border-rose-300/60 hover:bg-rose-500/15 hover:text-rose-50"
                    >
                      {text.actions.deleteArticle}
                    </Button>
                  ) : null}
                </div>

                {savedArticle?.status !== 'published' && publishValidationMessage !== null ? (
                  <p className="text-xs leading-relaxed text-(--text-muted)">
                    {publishValidationMessage}
                  </p>
                ) : null}

                {savedArticle !== null && isDeleteConfirmationVisible ? (
                  <div className="space-y-3 rounded-[1.4rem] border border-rose-400/35 bg-rose-500/10 p-4">
                    <p className="text-sm leading-relaxed text-rose-100">
                      {deleteConfirmationMessage}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => void onDeleteArticle()}
                        disabled={activeMutation !== null || isLoadingArticle}
                        className="border-rose-400/45 bg-rose-500/15 text-rose-50 hover:border-rose-300/60 hover:bg-rose-500/25"
                      >
                        {activeMutation === 'delete'
                          ? text.actions.deletingArticle
                          : text.actions.confirmDelete}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={onCancelDeleteArticle}
                        disabled={activeMutation !== null || isLoadingArticle}
                      >
                        {text.actions.cancelDelete}
                      </Button>
                    </div>
                  </div>
                ) : null}
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
                  {text.form.coverImageLabel}
                </p>
                {coverImage !== null ? (
                  <div className="overflow-hidden rounded-[1.4rem] border border-(--border-subtle) bg-[var(--surface-2)]">
                    {/* Cover URLs come from runtime storage/CDN configuration, so we render them directly here. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt={title.trim().length > 0 ? title : text.form.coverImageLabel}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-(--text-muted)">{text.form.coverImageEmpty}</p>
                )}
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
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-(--text-muted)">
                  {text.meta.autosaveStatus}
                </p>
                <p
                  className={
                    autosaveState === 'failed'
                      ? 'text-sm text-rose-200'
                      : 'text-sm text-(--text-muted)'
                  }
                >
                  {autosaveStatusLabel}
                </p>
                {savedArticle !== null && savedArticle.publishedAt !== null ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-(--text-muted)">
                      {text.meta.publishedAt}
                    </p>
                    <p className="text-sm text-(--text-muted)">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(savedArticle.publishedAt))}
                    </p>
                  </>
                ) : null}
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
