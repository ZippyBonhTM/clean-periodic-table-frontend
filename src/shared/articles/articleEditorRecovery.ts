import {
  hasArticleEditorChanges,
  type ArticleEditorDraftSnapshot,
} from '@/shared/articles/articleEditorUtils';

const ARTICLE_EDITOR_RECOVERY_STORAGE_PREFIX = 'article-editor-recovery';
const ARTICLE_EDITOR_RECOVERY_VERSION = 1;

type ArticleEditorRecoveryRecord = {
  version: 1;
  articleId: string | null;
  snapshot: ArticleEditorDraftSnapshot;
  savedArticleUpdatedAt: string | null;
  updatedAt: string;
};

function buildArticleEditorRecoveryStorageKey(articleId?: string): string {
  const normalizedArticleId = articleId?.trim().replace(/^\/+|\/+$/g, '') ?? '';
  return `${ARTICLE_EDITOR_RECOVERY_STORAGE_PREFIX}:${normalizedArticleId.length > 0 ? normalizedArticleId : 'new'}`;
}

function isArticleEditorDraftSnapshot(value: unknown): value is ArticleEditorDraftSnapshot {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const typedValue = value as Record<string, unknown>;
  const hashtags = typedValue.hashtags;

  return (
    typeof typedValue.title === 'string' &&
    typeof typedValue.excerpt === 'string' &&
    typeof typedValue.markdownSource === 'string' &&
    (typedValue.coverImage === null || typeof typedValue.coverImage === 'string') &&
    (typedValue.visibility === 'public' || typedValue.visibility === 'private') &&
    Array.isArray(hashtags) &&
    hashtags.every((hashtag) => typeof hashtag === 'string')
  );
}

function parseArticleEditorRecoveryRecord(rawValue: string | null): ArticleEditorRecoveryRecord | null {
  if (rawValue === null || rawValue.trim().length === 0) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Record<string, unknown>;

    if (
      parsedValue.version !== ARTICLE_EDITOR_RECOVERY_VERSION ||
      !isArticleEditorDraftSnapshot(parsedValue.snapshot) ||
      (parsedValue.articleId !== null && typeof parsedValue.articleId !== 'string') ||
      (parsedValue.savedArticleUpdatedAt !== null &&
        typeof parsedValue.savedArticleUpdatedAt !== 'string') ||
      typeof parsedValue.updatedAt !== 'string'
    ) {
      return null;
    }

    return {
      version: ARTICLE_EDITOR_RECOVERY_VERSION,
      articleId: parsedValue.articleId as string | null,
      snapshot: parsedValue.snapshot,
      savedArticleUpdatedAt: parsedValue.savedArticleUpdatedAt as string | null,
      updatedAt: parsedValue.updatedAt,
    };
  } catch {
    return null;
  }
}

function buildArticleEditorRecoveryRecord(input: {
  articleId?: string;
  snapshot: ArticleEditorDraftSnapshot;
  savedArticleUpdatedAt?: string | null;
  updatedAt?: string;
}): ArticleEditorRecoveryRecord {
  const normalizedArticleId = input.articleId?.trim().replace(/^\/+|\/+$/g, '') ?? '';

  return {
    version: ARTICLE_EDITOR_RECOVERY_VERSION,
    articleId: normalizedArticleId.length > 0 ? normalizedArticleId : null,
    snapshot: input.snapshot,
    savedArticleUpdatedAt: input.savedArticleUpdatedAt ?? null,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

function shouldOfferArticleEditorRecovery(input: {
  recoveryRecord: ArticleEditorRecoveryRecord | null;
  savedDraft: ArticleEditorDraftSnapshot | null;
}): boolean {
  if (input.recoveryRecord === null) {
    return false;
  }

  return hasArticleEditorChanges(input.recoveryRecord.snapshot, input.savedDraft);
}

export {
  ARTICLE_EDITOR_RECOVERY_STORAGE_PREFIX,
  ARTICLE_EDITOR_RECOVERY_VERSION,
  buildArticleEditorRecoveryRecord,
  buildArticleEditorRecoveryStorageKey,
  parseArticleEditorRecoveryRecord,
  shouldOfferArticleEditorRecovery,
};
export type { ArticleEditorRecoveryRecord };
