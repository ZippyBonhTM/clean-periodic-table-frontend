import publicEnv from '@/shared/config/publicEnv';
import type { ArticleCursorPage, ArticleDetail, ArticleFeedItem } from '@/shared/types/article';

type ListPublicArticleFeedServerInput = {
  limit?: number;
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

export async function listPublicArticleFeedServer(
  input: ListPublicArticleFeedServerInput = {},
): Promise<ListPublicArticleFeedServerResult> {
  const baseUrl = publicEnv.articleApiUrl;

  if (baseUrl === null) {
    return {
      feed: buildEmptyFeed(),
      isAvailable: false,
      errorMessage: 'Article API URL is not configured on the frontend runtime.',
    };
  }

  try {
    const url = new URL('/api/v1/feed', baseUrl);

    if (input.limit !== undefined) {
      url.searchParams.set('limit', String(input.limit));
    }

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
  const baseUrl = publicEnv.articleApiUrl;

  if (baseUrl === null) {
    return {
      article: null,
      state: 'unavailable',
      errorMessage: 'Article API URL is not configured on the frontend runtime.',
    };
  }

  try {
    const url = new URL(`/api/v1/articles/by-slug/${encodeURIComponent(input.slug)}`, baseUrl);
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
