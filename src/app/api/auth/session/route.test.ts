import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
  SERVER_ACCESS_TOKEN_COOKIE_KEY,
} from '@/shared/auth/serverAccessTokenCookie';

const originalAuthApiUrl = process.env.AUTH_API_URL;
const originalNodeEnv = process.env.NODE_ENV;

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    process.env.AUTH_API_URL = 'https://auth.example.com';
    process.env.NODE_ENV = 'test';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.AUTH_API_URL = originalAuthApiUrl;
    process.env.NODE_ENV = originalNodeEnv;
    vi.unstubAllGlobals();
  });

  it('returns the current authenticated session when the provided access token is still valid', async () => {
    const fetchSpy = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          accessToken: 'still-valid-token',
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
    });

    vi.stubGlobal('fetch', fetchSpy);

    const { GET } = await import('@/app/api/auth/session/route');
    const request = new NextRequest('http://localhost:3000/api/auth/session', {
      headers: {
        authorization: 'Bearer still-valid-token',
        cookie: 'refreshToken=refresh-cookie',
      },
    });

    const response = await GET(request);
    const body = await response.json();
    const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = responseHeaders.getSetCookie?.() ?? [];

    expect(response.status).toBe(200);
    expect(body).toEqual({
      authenticated: true,
      accessToken: 'still-valid-token',
      userProfile: {
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
        role: 'USER',
      },
      message: 'Profile loaded.',
    });
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${SERVER_ACCESS_TOKEN_COOKIE_KEY}=still-valid-token`),
        expect.stringContaining(`${CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY}=still-valid-token`),
      ]),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('refreshes the session and retries profile resolution when the access token is expired', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input : new URL(String(input));
      const requestHeaders = new Headers(init?.headers);
      const authorizationHeader = requestHeaders.get('authorization');

      if (url.pathname === '/profile' && authorizationHeader === 'Bearer expired-token') {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: {
            'content-type': 'application/json',
          },
        });
      }

      if (url.pathname === '/refresh') {
        return new Response(
          JSON.stringify({
            accessToken: 'fresh-token',
            message: 'Session refreshed.',
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

      if (url.pathname === '/profile' && authorizationHeader === 'Bearer fresh-token') {
        return new Response(
          JSON.stringify({
            accessToken: 'fresh-token',
            userProfile: {
              id: 'user-2',
              name: 'Grace',
              email: 'grace@example.com',
              role: 'ADMIN',
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

      throw new Error(`Unexpected request to ${url.toString()}`);
    });

    vi.stubGlobal('fetch', fetchSpy);

    const { GET } = await import('@/app/api/auth/session/route');
    const request = new NextRequest('http://localhost:3000/api/auth/session', {
      headers: {
        authorization: 'Bearer expired-token',
        cookie: 'refreshToken=refresh-cookie',
      },
    });

    const response = await GET(request);
    const body = await response.json();
    const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = responseHeaders.getSetCookie?.() ?? [];

    expect(response.status).toBe(200);
    expect(body).toEqual({
      authenticated: true,
      accessToken: 'fresh-token',
      userProfile: {
        id: 'user-2',
        name: 'Grace',
        email: 'grace@example.com',
        role: 'ADMIN',
      },
      message: 'Profile loaded.',
    });
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining('refreshToken=new-refresh-token'),
        expect.stringContaining(`${SERVER_ACCESS_TOKEN_COOKIE_KEY}=fresh-token`),
        expect.stringContaining(`${CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY}=fresh-token`),
      ]),
    );
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('returns unauthenticated and clears mirrored access cookies when refresh also fails', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof URL ? input : new URL(String(input));

      if (url.pathname === '/refresh') {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: {
            'content-type': 'application/json',
          },
        });
      }

      throw new Error(`Unexpected request to ${url.toString()}`);
    });

    vi.stubGlobal('fetch', fetchSpy);

    const { GET } = await import('@/app/api/auth/session/route');
    const request = new NextRequest('http://localhost:3000/api/auth/session', {
      headers: {
        cookie: 'refreshToken=refresh-cookie',
      },
    });

    const response = await GET(request);
    const body = await response.json();
    const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = responseHeaders.getSetCookie?.() ?? [];

    expect(response.status).toBe(401);
    expect(body).toEqual({
      authenticated: false,
      accessToken: null,
      userProfile: null,
      message: 'Unauthorized',
    });
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${SERVER_ACCESS_TOKEN_COOKIE_KEY}=;`),
        expect.stringContaining(`${CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY}=;`),
      ]),
    );
  });
});
