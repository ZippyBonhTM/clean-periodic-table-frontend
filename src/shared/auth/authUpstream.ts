import { stripServerAccessTokenCookie } from '@/shared/auth/serverAccessTokenCookie';

function resolveAuthUpstreamBaseUrl(): string | null {
  const preferredBaseUrl = process.env.AUTH_API_URL?.trim();
  const fallbackBaseUrl = process.env.NEXT_PUBLIC_AUTH_API_URL?.trim();
  const trimmed =
    preferredBaseUrl !== undefined && preferredBaseUrl.length > 0
      ? preferredBaseUrl
      : fallbackBaseUrl ?? '';

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

function buildAuthUpstreamUrl(path: string): URL | null {
  const baseUrl = resolveAuthUpstreamBaseUrl();

  if (baseUrl === null) {
    return null;
  }

  const normalizedPath = path
    .trim()
    .replace(/^\/?api\/auth\/?/, '')
    .replace(/^\/+/, '');

  if (normalizedPath.length === 0) {
    return null;
  }

  return new URL(normalizedPath, `${baseUrl}/`);
}

function buildAuthUpstreamApiUrl(path: string): URL | null {
  const baseUrl = resolveAuthUpstreamBaseUrl();

  if (baseUrl === null) {
    return null;
  }

  const normalizedPath = path.trim().replace(/^\/+/, '');

  if (normalizedPath.length === 0) {
    return null;
  }

  return new URL(normalizedPath, `${baseUrl}/`);
}

function stripForwardedAuthCookieHeader(cookieHeader: string | null): string | null {
  return stripServerAccessTokenCookie(cookieHeader);
}

export {
  buildAuthUpstreamApiUrl,
  buildAuthUpstreamUrl,
  resolveAuthUpstreamBaseUrl,
  stripForwardedAuthCookieHeader,
};
