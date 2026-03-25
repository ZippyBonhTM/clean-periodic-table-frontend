function normalizeBaseUrl(rawValue: string | undefined): string | null {
  const trimmed = rawValue?.trim() ?? '';

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const normalizedPath =
      parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');

    return `${parsed.origin}${normalizedPath}`;
  } catch {
    return null;
  }
}

function resolveArticleUpstreamBaseUrl(): string | null {
  return (
    normalizeBaseUrl(process.env.ARTICLE_API_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_ARTICLE_API_URL)
  );
}

function buildArticleUpstreamApiUrl(path: string): URL | null {
  const baseUrl = resolveArticleUpstreamBaseUrl();

  if (baseUrl === null) {
    return null;
  }

  const normalizedPath = path.trim().replace(/^\/+/, '');

  if (normalizedPath.length === 0) {
    return null;
  }

  return new URL(normalizedPath, `${baseUrl}/`);
}

export { buildArticleUpstreamApiUrl, resolveArticleUpstreamBaseUrl };
