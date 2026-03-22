import { describe, expect, it } from 'vitest';

import {
  readServerAccessTokenFromResponseBody,
  resolveTokenMaxAgeSeconds,
  stripServerAccessTokenCookie,
} from '@/shared/auth/serverAccessTokenCookie';

function createJwt(expSecondsFromNow: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    }),
  ).toString('base64url');

  return `${header}.${payload}.signature`;
}

describe('serverAccessTokenCookie', () => {
  it('reads the access token from a successful auth response body', () => {
    expect(
      readServerAccessTokenFromResponseBody(
        JSON.stringify({
          accessToken: 'token-123',
          message: 'ok',
        }),
      ),
    ).toBe('token-123');
  });

  it('returns null when the auth response body has no access token', () => {
    expect(readServerAccessTokenFromResponseBody(JSON.stringify({ message: 'ok' }))).toBeNull();
    expect(readServerAccessTokenFromResponseBody('not-json')).toBeNull();
  });

  it('strips the mirrored server access token from forwarded cookie headers', () => {
    expect(
      stripServerAccessTokenCookie(
        'foo=bar; clean_periodic_table_server_access_token=abc; theme=dark',
      ),
    ).toBe('foo=bar; theme=dark');
    expect(
      stripServerAccessTokenCookie(
        'clean_periodic_table_server_access_token=abc',
      ),
    ).toBeNull();
  });

  it('derives a positive max-age from the token expiry when available', () => {
    expect(resolveTokenMaxAgeSeconds(createJwt(180))).toBeGreaterThan(0);
    expect(resolveTokenMaxAgeSeconds('invalid-token')).toBeUndefined();
  });
});
