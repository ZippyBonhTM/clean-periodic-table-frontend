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

function resolveBackendUpstreamBaseUrl(): string | null {
  return (
    normalizeBaseUrl(process.env.BACKEND_API_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_API_URL)
  );
}

function buildBackendUpstreamUrl(path: string): URL | null {
  const baseUrl = resolveBackendUpstreamBaseUrl();

  if (baseUrl === null) {
    return null;
  }

  const normalizedPath = path.trim().replace(/^\/+/, '');

  if (normalizedPath.length === 0) {
    return null;
  }

  return new URL(normalizedPath, `${baseUrl}/`);
}

export { buildBackendUpstreamUrl, resolveBackendUpstreamBaseUrl };
