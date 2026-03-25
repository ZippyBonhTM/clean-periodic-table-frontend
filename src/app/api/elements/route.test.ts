import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
  SERVER_ACCESS_TOKEN_COOKIE_KEY,
} from '@/shared/auth/serverAccessTokenCookie';

const originalAuthApiUrl = process.env.AUTH_API_URL;
const originalBackendApiUrl = process.env.BACKEND_API_URL;
const originalNodeEnv = process.env.NODE_ENV;

describe('GET /api/elements', () => {
  beforeEach(() => {
    process.env.AUTH_API_URL = 'https://auth.example.com';
    process.env.BACKEND_API_URL = 'https://backend.example.com';
    process.env.NODE_ENV = 'test';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.AUTH_API_URL = originalAuthApiUrl;
    process.env.BACKEND_API_URL = originalBackendApiUrl;
    process.env.NODE_ENV = originalNodeEnv;
    vi.unstubAllGlobals();
  });

  it('recovers the server auth session before loading protected elements', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input : new URL(String(input));
      const requestHeaders = new Headers(init?.headers);
      const authorizationHeader = requestHeaders.get('authorization');

      if (url.origin === 'https://auth.example.com' && url.pathname === '/refresh') {
        return new Response(
          JSON.stringify({
            accessToken: 'fresh-token',
            message: 'Refreshed.',
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
              'set-cookie': 'refreshToken=new-refresh-token; Path=/; HttpOnly; Secure; SameSite=None',
            },
          },
        );
      }

      if (
        url.origin === 'https://auth.example.com' &&
        url.pathname === '/profile' &&
        authorizationHeader === 'Bearer fresh-token'
      ) {
        return new Response(
          JSON.stringify({
            accessToken: 'fresh-token',
            userProfile: {
              id: 'user-1',
              name: 'Ada',
              email: 'ada@example.com',
              role: 'USER',
            },
            message: 'Profile loaded.',
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        );
      }

      if (
        url.origin === 'https://backend.example.com' &&
        url.pathname === '/elements' &&
        authorizationHeader === 'Bearer fresh-token'
      ) {
        return new Response(
          JSON.stringify([
            {
              number: 1,
              symbol: 'H',
              name: 'Hydrogen',
            },
          ]),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        );
      }

      throw new Error(`Unexpected request to ${url.toString()} (${authorizationHeader ?? 'no-auth'})`);
    });

    vi.stubGlobal('fetch', fetchSpy);

    const { GET } = await import('@/app/api/elements/route');
    const request = new NextRequest('http://localhost:3000/api/elements', {
      headers: {
        cookie: 'refreshToken=refresh-cookie',
      },
    });

    const response = await GET(request);
    const body = await response.json();
    const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = responseHeaders.getSetCookie?.() ?? [];

    expect(response.status).toBe(200);
    expect(body).toEqual([
      {
        number: 1,
        symbol: 'H',
        name: 'Hydrogen',
      },
    ]);
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining('refreshToken=new-refresh-token'),
        expect.stringContaining(`${SERVER_ACCESS_TOKEN_COOKIE_KEY}=fresh-token`),
        expect.stringContaining(`${CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY}=fresh-token`),
      ]),
    );
  });
});
