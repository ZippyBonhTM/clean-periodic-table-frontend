import publicEnv from '@/shared/config/publicEnv';
import type { ArticleCursorPage, ArticleFeedItem } from '@/shared/types/article';

type ListPublicArticleFeedServerInput = {
  limit?: number;
};

type ListPublicArticleFeedServerResult = {
  feed: ArticleCursorPage<ArticleFeedItem>;
  isAvailable: boolean;
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

