import publicEnv from '@/shared/config/publicEnv';

import { requestJson } from './httpClient';
import type {
  ArticleApi,
  ArticleCursorInput,
  ArticleDetailInput,
  ArticleOwnedDetailInput,
  ArticlePublishInput,
  ArticleSearchInput,
  ArticleUnpublishInput,
  CreateArticleDraftInput,
  UpdateArticleInput,
} from './articleApi.types';
import type { ArticleCursorPage, ArticleDetail, ArticleFeedItem, ArticleSummary } from '@/shared/types/article';

class ArticleApiConfigurationError extends Error {
  readonly code = 'ARTICLE_API_NOT_CONFIGURED';

  constructor(message = 'Article API URL is not configured.') {
    super(message);
    this.name = 'ArticleApiConfigurationError';
  }
}

function resolveArticleApiBaseUrl(): string {
  const baseUrl = publicEnv.articleApiUrl;

  if (baseUrl === null) {
    throw new ArticleApiConfigurationError();
  }

  return baseUrl;
}

function buildCursorQuery(input: ArticleCursorInput = {}): string {
  const searchParams = new URLSearchParams();

  if (input.cursor !== undefined && input.cursor !== null && input.cursor.length > 0) {
    searchParams.set('cursor', input.cursor);
  }

  if (input.limit !== undefined) {
    searchParams.set('limit', String(input.limit));
  }

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : '';
}

function buildSearchQuery(input: ArticleSearchInput): string {
  const searchParams = new URLSearchParams();
  searchParams.set('q', input.query);

  if (input.cursor !== undefined && input.cursor !== null && input.cursor.length > 0) {
    searchParams.set('cursor', input.cursor);
  }

  if (input.limit !== undefined) {
    searchParams.set('limit', String(input.limit));
  }

  return `?${searchParams.toString()}`;
}

function createArticleApi(): ArticleApi {
  return {
    async getGlobalFeed(input = {}) {
      return await requestJson<ArticleCursorPage<ArticleFeedItem>>(
        resolveArticleApiBaseUrl(),
        `/api/v1/feed${buildCursorQuery(input)}`,
        {
          method: 'GET',
          signal: input.signal,
        },
      );
    },

    async getMyArticleById(input) {
      return await requestJson<ArticleDetail>(
        resolveArticleApiBaseUrl(),
        `/api/v1/articles/${encodeURIComponent(input.articleId)}`,
        {
          method: 'GET',
          token: input.token,
          signal: input.signal,
        },
      );
    },

    async getArticleBySlug(input) {
      const encodedSlug = encodeURIComponent(input.slug);

      return await requestJson<ArticleDetail>(
        resolveArticleApiBaseUrl(),
        `/api/v1/articles/by-slug/${encodedSlug}`,
        {
          method: 'GET',
          token: input.token ?? null,
          signal: input.signal,
        },
      );
    },

    async searchArticles(input) {
      return await requestJson<ArticleCursorPage<ArticleFeedItem>>(
        resolveArticleApiBaseUrl(),
        `/api/v1/search${buildSearchQuery(input)}`,
        {
          method: 'GET',
          signal: input.signal,
        },
      );
    },

    async listMyArticles(input) {
      return await requestJson<ArticleCursorPage<ArticleSummary>>(
        resolveArticleApiBaseUrl(),
        `/api/v1/me/articles${buildCursorQuery(input)}`,
        {
          method: 'GET',
          token: input.token,
          signal: input.signal,
        },
      );
    },

    async createDraft(input) {
      return await requestJson<ArticleDetail>(
        resolveArticleApiBaseUrl(),
        '/api/v1/articles',
        {
          method: 'POST',
          token: input.token,
          signal: input.signal,
          body: {
            title: input.title,
            markdown_source: input.markdownSource,
            visibility: input.visibility,
            hashtags: input.hashtags,
            excerpt: input.excerpt ?? '',
            cover_image: input.coverImage ?? null,
          },
        },
      );
    },

    async updateArticle(input) {
      return await requestJson<ArticleDetail>(
        resolveArticleApiBaseUrl(),
        `/api/v1/articles/${encodeURIComponent(input.articleId)}`,
        {
          method: 'PUT',
          token: input.token,
          signal: input.signal,
          body: {
            title: input.title,
            markdown_source: input.markdownSource,
            excerpt: input.excerpt,
            visibility: input.visibility,
            hashtags: input.hashtags,
            cover_image: input.coverImage,
          },
        },
      );
    },

    async publishArticle(input) {
      return await requestJson<ArticleDetail>(
        resolveArticleApiBaseUrl(),
        `/api/v1/articles/${encodeURIComponent(input.articleId)}/publish`,
        {
          method: 'POST',
          token: input.token,
          signal: input.signal,
        },
      );
    },

    async unpublishArticle(input) {
      return await requestJson<ArticleDetail>(
        resolveArticleApiBaseUrl(),
        `/api/v1/articles/${encodeURIComponent(input.articleId)}/unpublish`,
        {
          method: 'POST',
          token: input.token,
          signal: input.signal,
        },
      );
    },
  };
}

const articleApi = createArticleApi();

export { ArticleApiConfigurationError, articleApi, createArticleApi };
export type {
  ArticleApi,
  ArticleDetailInput,
  ArticleOwnedDetailInput,
  ArticlePublishInput,
  ArticleUnpublishInput,
  CreateArticleDraftInput,
  UpdateArticleInput,
  ArticleSearchInput,
};
