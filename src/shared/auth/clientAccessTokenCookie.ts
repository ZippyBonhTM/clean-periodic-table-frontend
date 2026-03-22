import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
  resolveTokenMaxAgeSeconds,
} from '@/shared/auth/serverAccessTokenCookie';

function buildCookieAttributes(maxAgeSeconds?: number): string {
  const attributes = ['path=/', 'samesite=lax'];

  if (process.env.NODE_ENV === 'production') {
    attributes.push('secure');
  }

  if (maxAgeSeconds !== undefined) {
    attributes.push(`max-age=${maxAgeSeconds}`);
  }

  return attributes.join('; ');
}

function persistClientServerAccessTokenCookie(token: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const normalizedToken = token.trim();

  if (normalizedToken.length === 0) {
    return;
  }

  document.cookie = `${CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY}=${encodeURIComponent(normalizedToken)}; ${buildCookieAttributes(
    resolveTokenMaxAgeSeconds(normalizedToken),
  )}`;
}

function clearClientServerAccessTokenCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY}=; ${buildCookieAttributes(0)}`;
}

export {
  clearClientServerAccessTokenCookie,
  persistClientServerAccessTokenCookie,
};
