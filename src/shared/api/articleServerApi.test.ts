import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalNodeEnv = process.env.NODE_ENV;
const originalPublicBackendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const originalPublicArticleApiUrl = process.env.NEXT_PUBLIC_ARTICLE_API_URL;

describe('articleServerApi', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.NEXT_PUBLIC_BACKEND_API_URL = 'https://backend.example.com';
    process.env.NEXT_PUBLIC_ARTICLE_API_URL = 'https://article.example.com';
    vi.restoreAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.NEXT_PUBLIC_BACKEND_API_URL = originalPublicBackendApiUrl;
    process.env.NEXT_PUBLIC_ARTICLE_API_URL = originalPublicArticleApiUrl;
    vi.unstubAllGlobals();
  });

  it('loads the public feed from the backend upstream', async () => {
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

    const { listPublicArticleFeedServer } = await import('@/shared/api/articleServerApi');
    const result = await listPublicArticleFeedServer();

    expect(result).toEqual({
      feed: {
        items: [],
        nextCursor: null,
      },
      isAvailable: true,
      errorMessage: null,
    });
  });

  it('loads public article detail from the backend upstream', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof URL ? input : new URL(String(input));

      if (
        url.origin === 'https://backend.example.com' &&
        url.pathname === '/api/v1/articles/by-slug/atomic-orbitals'
      ) {
        return new Response(
          JSON.stringify({
            id: 'article-1',
            title: 'Atomic Orbitals',
            slug: 'atomic-orbitals',
            excerpt: 'Orbitals',
            visibility: 'public',
            status: 'published',
            coverImage: null,
            hashtags: [],
            author: {
              id: 'author-1',
              displayName: 'Ada',
              username: 'ada',
              profileImage: null,
            },
            createdAt: '2026-03-25T00:00:00.000Z',
            updatedAt: '2026-03-25T00:00:00.000Z',
            publishedAt: '2026-03-25T00:00:00.000Z',
            markdownSource: '# Atomic Orbitals',
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

    const { getPublicArticleBySlugServer } = await import('@/shared/api/articleServerApi');
    const result = await getPublicArticleBySlugServer({ slug: 'atomic-orbitals' });

    expect(result).toMatchObject({
      state: 'available',
      article: {
        slug: 'atomic-orbitals',
        markdownSource: '# Atomic Orbitals',
      },
    });
  });
});
