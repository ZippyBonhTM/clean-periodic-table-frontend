import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ArticleApi } from '@/shared/api/articleApi.types';
import { createMockArticleApi } from '@/shared/api/articleApi.mock';

const sampleFeedResponse = {
  items: [
    {
      id: 'article-1',
      title: 'Article One',
      slug: 'article-one',
      excerpt: 'Excerpt',
      visibility: 'public' as const,
      status: 'published' as const,
      coverImage: null,
      hashtags: [],
      author: {
        id: 'author-1',
        displayName: 'Ada',
        username: 'ada',
        profileImage: null,
      },
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      publishedAt: '2026-03-01T00:00:00.000Z',
      relevanceScore: 99,
    },
  ],
  nextCursor: null,
};

describe('articleApi', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ARTICLE_API_URL;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('fails predictably when the article API is not configured', async () => {
    delete process.env.NEXT_PUBLIC_ARTICLE_API_URL;

    const { createArticleApi, ArticleApiConfigurationError } = await import('@/shared/api/articleApi');
    const api = createArticleApi();

    await expect(api.getGlobalFeed()).rejects.toBeInstanceOf(ArticleApiConfigurationError);
  });

  it('keeps slug-based reads and id-based writes unambiguous inside the adapter', async () => {
    process.env.NEXT_PUBLIC_ARTICLE_API_URL = 'http://localhost:4010';

    const fetchSpy = vi.fn(async (input: URL | RequestInfo) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (
        url.includes('/by-slug/') ||
        url.endsWith('/api/v1/articles/article-123') ||
        url.endsWith('/api/v1/articles/article-123/publish') ||
        url.endsWith('/api/v1/articles/article-123/unpublish')
      ) {
        return {
          ok: true,
          json: async () => ({
            id: 'article-1',
            title: 'Atomic Orbitals',
            slug: 'atomic-orbitals',
            excerpt: 'Excerpt',
            markdownSource: '# Atomic Orbitals',
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
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-01T00:00:00.000Z',
            publishedAt: '2026-03-01T00:00:00.000Z',
          }),
        };
      }

      return {
        ok: true,
        json: async () => sampleFeedResponse,
      };
    });

    vi.stubGlobal('fetch', fetchSpy);

    const { createArticleApi } = await import('@/shared/api/articleApi');
    const api: ArticleApi = createArticleApi();

    await api.getArticleBySlug({ slug: 'atomic-orbitals' });
    await api.getMyArticleById({
      articleId: 'article-123',
      token: 'token-1',
    });
    await api.updateArticle({
      articleId: 'article-123',
      token: 'token-1',
      title: 'Updated title',
    });
    await api.publishArticle({
      articleId: 'article-123',
      token: 'token-1',
    });
    await api.unpublishArticle({
      articleId: 'article-123',
      token: 'token-1',
    });

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      new URL('http://localhost:4010/api/v1/articles/by-slug/atomic-orbitals'),
      expect.any(Object),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      new URL('http://localhost:4010/api/v1/articles/article-123'),
      expect.any(Object),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      new URL('http://localhost:4010/api/v1/articles/article-123'),
      expect.any(Object),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      4,
      new URL('http://localhost:4010/api/v1/articles/article-123/publish'),
      expect.any(Object),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      5,
      new URL('http://localhost:4010/api/v1/articles/article-123/unpublish'),
      expect.any(Object),
    );
  });

  it('exposes a deterministic mock adapter under the same contract', async () => {
    const api: ArticleApi = createMockArticleApi();

    const feed = await api.getGlobalFeed();
    const ownDetail = await api.getMyArticleById({
      articleId: 'article-stoichiometry-draft',
      token: 'token-1',
    });
    const publishedDetail = await api.publishArticle({
      articleId: 'article-stoichiometry-draft',
      token: 'token-1',
    });
    const unpublishedDetail = await api.unpublishArticle({
      articleId: 'article-atomic-orbitals',
      token: 'token-1',
    });
    const detail = await api.getArticleBySlug({
      slug: 'atomic-orbitals-for-curious-beginners',
    });

    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]?.status).toBe('published');
    expect(ownDetail.id).toBe('article-stoichiometry-draft');
    expect(publishedDetail.status).toBe('published');
    expect(publishedDetail.publishedAt).not.toBeNull();
    expect(unpublishedDetail.status).toBe('draft');
    expect(unpublishedDetail.publishedAt).toBeNull();
    expect(detail.slug).toBe('atomic-orbitals-for-curious-beginners');
    expect(detail.markdownSource).toContain('Atomic Orbitals');
  });
});
