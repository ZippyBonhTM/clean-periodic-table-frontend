import publicEnv from '@/shared/config/publicEnv';
import { normalizeHashtagValue } from '@/shared/articles/articleFeedFilters';
import type { ArticleCursorPage, ArticleDetail, ArticleFeedItem } from '@/shared/types/article';

type ListPublicArticleFeedServerInput = {
  limit?: number;
  cursor?: string | null;
  query?: string | null;
  hashtag?: string | null;
};

type ListPublicArticleFeedServerResult = {
  feed: ArticleCursorPage<ArticleFeedItem>;
  isAvailable: boolean;
  errorMessage: string | null;
};

type GetPublicArticleBySlugServerInput = {
  slug: string;
};

type GetPublicArticleBySlugServerResult =
  | {
      article: ArticleDetail;
      state: 'available';
      errorMessage: null;
    }
  | {
      article: null;
      state: 'not-found' | 'unavailable';
      errorMessage: string | null;
    };

const ARTICLE_FEED_SERVER_REVALIDATE_SECONDS = 60 * 5;

function buildEmptyFeed(): ArticleCursorPage<ArticleFeedItem> {
  return {
    items: [],
    nextCursor: null,
  };
}

function applyCursorSearchParams(
  url: URL,
  input: {
    cursor?: string | null;
    limit?: number;
  },
): void {
  if (input.cursor !== undefined && input.cursor !== null && input.cursor.length > 0) {
    url.searchParams.set('cursor', input.cursor);
  }

  if (input.limit !== undefined) {
    url.searchParams.set('limit', String(input.limit));
  }
}

function resolvePublicArticleReadBaseUrl(): string {
  return publicEnv.backendApiUrl;
}

function buildPublicArticleFeedUrl(
  baseUrl: string,
  input: ListPublicArticleFeedServerInput,
): URL {
  const normalizedQuery = input.query?.trim() ?? '';

  if (normalizedQuery.length > 0) {
    const url = new URL('/api/v1/search', baseUrl);
    url.searchParams.set('q', normalizedQuery);
    applyCursorSearchParams(url, input);
    return url;
  }

  const normalizedHashtag = normalizeHashtagValue(input.hashtag ?? undefined);

  if (normalizedHashtag !== null) {
    const url = new URL(`/api/v1/feed/hashtag/${encodeURIComponent(normalizedHashtag)}`, baseUrl);
    applyCursorSearchParams(url, input);
    return url;
  }

  const url = new URL('/api/v1/feed', baseUrl);
  applyCursorSearchParams(url, input);
  return url;
}

export async function listPublicArticleFeedServer(
  input: ListPublicArticleFeedServerInput = {},
): Promise<ListPublicArticleFeedServerResult> {
  try {
    const url = buildPublicArticleFeedUrl(resolvePublicArticleReadBaseUrl(), input);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: ARTICLE_FEED_SERVER_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      return {
        feed: buildEmptyFeed(),
        isAvailable: false,
        errorMessage: 'The article feed is temporarily unavailable.',
      };
    }

    const feed = (await response.json()) as ArticleCursorPage<ArticleFeedItem>;

    return {
      feed,
      isAvailable: true,
      errorMessage: null,
    };
  } catch {
    return {
      feed: buildEmptyFeed(),
      isAvailable: false,
      errorMessage: 'The article feed is temporarily unavailable.',
    };
  }
}

export async function getPublicArticleBySlugServer(
  input: GetPublicArticleBySlugServerInput,
): Promise<GetPublicArticleBySlugServerResult> {
  try {
    const url = new URL(
      `/api/v1/articles/by-slug/${encodeURIComponent(input.slug)}`,
      resolvePublicArticleReadBaseUrl(),
    );
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: ARTICLE_FEED_SERVER_REVALIDATE_SECONDS,
      },
    });

    if (response.status === 404 || response.status === 401 || response.status === 403) {
      return {
        article: null,
        state: 'not-found',
        errorMessage: null,
      };
    }

    if (!response.ok) {
      return {
        article: null,
        state: 'unavailable',
        errorMessage: 'The requested article is temporarily unavailable.',
      };
    }

    const article = (await response.json()) as ArticleDetail;

    return {
      article,
      state: 'available',
      errorMessage: null,
    };
  } catch {
    return {
      article: null,
      state: 'unavailable',
      errorMessage: 'The requested article is temporarily unavailable.',
    };
  }
}
