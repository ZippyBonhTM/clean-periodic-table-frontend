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

export {
  buildArticleSlugPreview,
  parseArticleHashtags,
  validateArticlePublishInput,
};
export type { ArticlePublishValidationCode };
