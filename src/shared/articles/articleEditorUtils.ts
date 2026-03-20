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

export { buildArticleSlugPreview, parseArticleHashtags };
