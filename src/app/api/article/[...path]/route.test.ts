import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
  SERVER_ACCESS_TOKEN_COOKIE_KEY,
} from '@/shared/auth/serverAccessTokenCookie';

const originalAuthApiUrl = process.env.AUTH_API_URL;
const originalArticleApiUrl = process.env.ARTICLE_API_URL;
const originalPublicArticleApiUrl = process.env.NEXT_PUBLIC_ARTICLE_API_URL;
const originalNodeEnv = process.env.NODE_ENV;

describe('article proxy route', () => {
  beforeEach(() => {
    process.env.AUTH_API_URL = 'https://auth.example.com';
    process.env.ARTICLE_API_URL = 'https://article.example.com';
    process.env.NEXT_PUBLIC_ARTICLE_API_URL = 'https://public-article.example.com';
    process.env.NODE_ENV = 'test';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.AUTH_API_URL = originalAuthApiUrl;
    process.env.ARTICLE_API_URL = originalArticleApiUrl;
    process.env.NEXT_PUBLIC_ARTICLE_API_URL = originalPublicArticleApiUrl;
    process.env.NODE_ENV = originalNodeEnv;
    vi.unstubAllGlobals();
  });

  it('recovers the session server-side for protected article routes', async () => {
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
        url.origin === 'https://article.example.com' &&
        url.pathname === '/api/v1/me/articles' &&
        authorizationHeader === 'Bearer fresh-token'
      ) {
        return new Response(
          JSON.stringify({
            items: [],
            nextCursor: null,
          }),
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

    const { GET } = await import('@/app/api/article/[...path]/route');
    const request = new NextRequest('http://localhost:3000/api/article/me/articles', {
      headers: {
        cookie: 'refreshToken=refresh-cookie',
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({
        path: ['me', 'articles'],
      }),
    });
    const body = await response.json();
    const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = responseHeaders.getSetCookie?.() ?? [];

    expect(response.status).toBe(200);
    expect(body).toEqual({
      items: [],
      nextCursor: null,
    });
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining('refreshToken=new-refresh-token'),
        expect.stringContaining(`${SERVER_ACCESS_TOKEN_COOKIE_KEY}=fresh-token`),
        expect.stringContaining(`${CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY}=fresh-token`),
      ]),
    );
  });

  it('keeps public article reads anonymous when no auth session is available', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input : new URL(String(input));
      const requestHeaders = new Headers(init?.headers);
      const authorizationHeader = requestHeaders.get('authorization');

      if (
        url.origin === 'https://auth.example.com' &&
        url.pathname === '/refresh'
      ) {
        return new Response(
          JSON.stringify({
            message: 'Not authenticated.',
          }),
          {
            status: 401,
            headers: {
              'content-type': 'application/json',
            },
          },
        );
      }

      if (
        url.origin === 'https://article.example.com' &&
        url.pathname === '/api/v1/articles/by-slug/atomic-orbitals' &&
        authorizationHeader === null
      ) {
        return new Response(
          JSON.stringify({
            id: 'article-1',
            title: 'Atomic Orbitals',
            slug: 'atomic-orbitals',
          }),
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

    const { GET } = await import('@/app/api/article/[...path]/route');
    const request = new NextRequest(
      'http://localhost:3000/api/article/articles/by-slug/atomic-orbitals',
    );

    const response = await GET(request, {
      params: Promise.resolve({
        path: ['articles', 'by-slug', 'atomic-orbitals'],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.slug).toBe('atomic-orbitals');
  });
});
