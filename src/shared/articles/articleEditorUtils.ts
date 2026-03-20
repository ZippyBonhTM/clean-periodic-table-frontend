import type { ArticleVisibility } from '@/shared/types/article';

const ARTICLE_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const ARTICLE_IMAGE_UPLOAD_ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

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
type ArticleImageValidationCode = 'invalid_type' | 'file_too_large';
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

function validateArticleImageFile(input: {
  type: string;
  size: number;
}): ArticleImageValidationCode | null {
  if (!ARTICLE_IMAGE_UPLOAD_ACCEPTED_MIME_TYPES.includes(input.type as never)) {
    return 'invalid_type';
  }

  if (input.size > ARTICLE_IMAGE_UPLOAD_MAX_BYTES) {
    return 'file_too_large';
  }

  return null;
}

function buildArticleImageAltText(fileName: string): string {
  const cleanedName = fileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanedName.length > 0 ? cleanedName : 'article image';
}

function buildArticleImageMarkdown(fileName: string, fileUrl: string): string {
  return `![${buildArticleImageAltText(fileName)}](${fileUrl})`;
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
  ARTICLE_IMAGE_UPLOAD_ACCEPTED_MIME_TYPES,
  ARTICLE_IMAGE_UPLOAD_MAX_BYTES,
  buildArticleImageAltText,
  buildArticleImageMarkdown,
  buildArticleSlugPreview,
  hasArticleEditorChanges,
  parseArticleHashtags,
  validateArticleImageFile,
  validateArticlePublishInput,
};
export type {
  ArticleEditorDraftSnapshot,
  ArticleImageValidationCode,
  ArticlePublishValidationCode,
};
