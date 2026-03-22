import { afterEach, describe, expect, it } from 'vitest';

import {
  buildAuthUpstreamUrl,
  resolveAuthUpstreamBaseUrl,
  stripForwardedAuthCookieHeader,
} from '@/shared/auth/authUpstream';
import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
  SERVER_ACCESS_TOKEN_COOKIE_KEY,
} from '@/shared/auth/serverAccessTokenCookie';

const originalAuthApiUrl = process.env.AUTH_API_URL;
const originalPublicAuthApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;

afterEach(() => {
  process.env.AUTH_API_URL = originalAuthApiUrl;
  process.env.NEXT_PUBLIC_AUTH_API_URL = originalPublicAuthApiUrl;
});

describe('authUpstream', () => {
  it('normalizes the configured auth upstream base url and builds upstream auth urls', () => {
    process.env.AUTH_API_URL = 'https://auth.example.com/internal/';
    expect(resolveAuthUpstreamBaseUrl()).toBe('https://auth.example.com/internal');
    expect(buildAuthUpstreamUrl('/api/auth/profile')?.toString()).toBe(
      'https://auth.example.com/internal/profile',
    );
    expect(buildAuthUpstreamUrl('refresh')?.toString()).toBe(
      'https://auth.example.com/internal/refresh',
    );
  });

  it('falls back to the public auth url when needed', () => {
    process.env.AUTH_API_URL = '';
    process.env.NEXT_PUBLIC_AUTH_API_URL = 'https://public-auth.example.com';

    expect(resolveAuthUpstreamBaseUrl()).toBe('https://public-auth.example.com');
  });

  it('strips mirrored access token cookies before forwarding auth cookies upstream', () => {
    expect(
      stripForwardedAuthCookieHeader(
        `refresh=abc; ${SERVER_ACCESS_TOKEN_COOKIE_KEY}=server; ${CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY}=client; theme=dark`,
      ),
    ).toBe('refresh=abc; theme=dark');
  });
});
