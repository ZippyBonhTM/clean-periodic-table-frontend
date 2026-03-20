import type { ArticleVisibility } from '@/shared/types/article';

function normalizeAsciiToken(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function buildArticleSlugPreview(title: string): string {
  const normalizedTitle = normalizeAsciiToken(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalizedTitle.length > 0 ? normalizedTitle : 'draft-preview';
}

function parseArticleHashtags(input: string): string[] {
  const normalizedTokens = normalizeAsciiToken(input)
    .split(/[\s,]+/g)
    .map((token) => token.replace(/^#+/g, '').replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, ''))
    .filter((token) => token.length > 0);

  const uniqueTokens = Array.from(new Set(normalizedTokens));
  return uniqueTokens.slice(0, 10);
}

type ArticlePublishValidationCode = 'missing_title' | 'missing_markdown';
type ArticleEditorDraftSnapshot = {
  title: string;
  excerpt: string;
  markdownSource: string;
  visibility: ArticleVisibility;
  hashtags: string[];
};

function validateArticlePublishInput(input: {
  title: string;
  markdownSource: string;
}): ArticlePublishValidationCode | null {
  if (input.title.trim().length === 0) {
    return 'missing_title';
  }

  if (input.markdownSource.trim().length === 0) {
    return 'missing_markdown';
  }

  return null;
}

function hasArticleEditorChanges(
  currentDraft: ArticleEditorDraftSnapshot,
  savedDraft: ArticleEditorDraftSnapshot | null,
): boolean {
  if (savedDraft === null) {
    return (
      currentDraft.title.trim().length > 0 ||
      currentDraft.excerpt.trim().length > 0 ||
      currentDraft.markdownSource.trim().length > 0 ||
      currentDraft.visibility !== 'private' ||
      currentDraft.hashtags.length > 0
    );
  }

  return (
    currentDraft.title !== savedDraft.title ||
    currentDraft.excerpt !== savedDraft.excerpt ||
    currentDraft.markdownSource !== savedDraft.markdownSource ||
    currentDraft.visibility !== savedDraft.visibility ||
    currentDraft.hashtags.join('|') !== savedDraft.hashtags.join('|')
  );
}

export {
  buildArticleSlugPreview,
  hasArticleEditorChanges,
  parseArticleHashtags,
  validateArticlePublishInput,
};
export type {
  ArticleEditorDraftSnapshot,
  ArticlePublishValidationCode,
};
