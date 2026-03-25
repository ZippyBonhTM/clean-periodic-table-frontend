import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import {
  CLIENT_SERVER_ACCESS_TOKEN_COOKIE_KEY,
  SERVER_ACCESS_TOKEN_COOKIE_KEY,
} from '@/shared/auth/serverAccessTokenCookie';

const originalAuthApiUrl = process.env.AUTH_API_URL;
const originalBackendApiUrl = process.env.BACKEND_API_URL;
const originalPublicBackendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const originalArticleApiUrl = process.env.ARTICLE_API_URL;
const originalPublicArticleApiUrl = process.env.NEXT_PUBLIC_ARTICLE_API_URL;
const originalNodeEnv = process.env.NODE_ENV;

describe('article proxy route', () => {
  beforeEach(() => {
    process.env.AUTH_API_URL = 'https://auth.example.com';
    process.env.BACKEND_API_URL = 'https://backend.example.com';
    process.env.NEXT_PUBLIC_BACKEND_API_URL = 'https://backend.example.com';
    process.env.ARTICLE_API_URL = 'https://article.example.com';
    process.env.NEXT_PUBLIC_ARTICLE_API_URL = 'https://public-article.example.com';
    process.env.NODE_ENV = 'test';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.AUTH_API_URL = originalAuthApiUrl;
    process.env.BACKEND_API_URL = originalBackendApiUrl;
    process.env.NEXT_PUBLIC_BACKEND_API_URL = originalPublicBackendApiUrl;
    process.env.ARTICLE_API_URL = originalArticleApiUrl;
    process.env.NEXT_PUBLIC_ARTICLE_API_URL = originalPublicArticleApiUrl;
    process.env.NODE_ENV = originalNodeEnv;
    vi.unstubAllGlobals();
  });

  it('recovers the session server-side for protected owned article routes through the backend', async () => {
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

  it('recovers the session server-side for protected article draft creation through the backend', async () => {
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
        url.pathname === '/api/v1/articles' &&
        authorizationHeader === 'Bearer fresh-token'
      ) {
        return new Response(
          JSON.stringify({
            id: 'draft-1',
            title: 'Chemistry draft',
            slug: 'chemistry-draft',
            status: 'draft',
            visibility: 'private',
            markdownSource: '# Hello',
            excerpt: '',
            coverImage: null,
            hashtags: [],
            author: {
              id: 'user-1',
              displayName: null,
              username: null,
              profileImage: null,
            },
            createdAt: '2026-03-25T10:00:00.000Z',
            updatedAt: '2026-03-25T10:00:00.000Z',
            publishedAt: null,
          }),
          {
            status: 201,
            headers: {
              'content-type': 'application/json',
            },
          },
        );
      }

      throw new Error(`Unexpected request to ${url.toString()} (${authorizationHeader ?? 'no-auth'})`);
    });

    vi.stubGlobal('fetch', fetchSpy);

    const { POST } = await import('@/app/api/article/[...path]/route');
    const request = new NextRequest('http://localhost:3000/api/article/articles', {
      method: 'POST',
      headers: {
        cookie: 'refreshToken=refresh-cookie',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Chemistry draft',
        markdown_source: '# Hello',
        visibility: 'private',
        hashtags: [],
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({
        path: ['articles'],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      id: 'draft-1',
      slug: 'chemistry-draft',
      status: 'draft',
    });
  });

  it('proxies owned article detail reads through the backend upstream', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input : new URL(String(input));
      const requestHeaders = new Headers(init?.headers);
      const authorizationHeader = requestHeaders.get('authorization');

      if (
        url.origin === 'https://backend.example.com' &&
        url.pathname === '/api/v1/articles/draft-1' &&
        authorizationHeader === 'Bearer explicit-token'
      ) {
        return new Response(
          JSON.stringify({
            id: 'draft-1',
            title: 'Draft',
            slug: 'draft',
            status: 'draft',
            visibility: 'private',
            markdownSource: '# Draft',
            excerpt: '',
            coverImage: null,
            hashtags: [],
            author: {
              id: 'user-1',
              displayName: null,
              username: null,
              profileImage: null,
            },
            createdAt: '2026-03-25T10:00:00.000Z',
            updatedAt: '2026-03-25T10:00:00.000Z',
            publishedAt: null,
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
    const request = new NextRequest('http://localhost:3000/api/article/articles/draft-1', {
      headers: {
        authorization: 'Bearer explicit-token',
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({
        path: ['articles', 'draft-1'],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: 'draft-1',
      status: 'draft',
    });
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
        url.origin === 'https://backend.example.com' &&
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

  it('proxies public article feed reads through the backend upstream', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof URL ? input : new URL(String(input));

      if (url.origin === 'https://backend.example.com' && url.pathname === '/api/v1/feed') {
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

      throw new Error(`Unexpected request to ${url.toString()}`);
    });

    vi.stubGlobal('fetch', fetchSpy);

    const { GET } = await import('@/app/api/article/[...path]/route');
    const request = new NextRequest('http://localhost:3000/api/article/feed');

    const response = await GET(request, {
      params: Promise.resolve({
        path: ['feed'],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      items: [],
      nextCursor: null,
    });
  });
});
