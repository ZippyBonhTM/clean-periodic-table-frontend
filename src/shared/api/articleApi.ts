import { ApiError, requestJson } from './httpClient';

import type {
  ArticleApi,
  ArticleCursorInput,
  ArticleDetailInput,
  ArticleHashtagFeedInput,
  ArticleHashtagSuggestionsInput,
  ArticleImageUploadInput,
  ArticleImageUploadResult,
  ArticleOwnedDetailInput,
  ArticleDeleteInput,
  ArticleRecordOpenInput,
  ArticlePublishInput,
  ArticleRecordViewInput,
  ArticleSaveInput,
  ArticleSearchInput,
  ArticleUnpublishInput,
  CreateArticleDraftInput,
  UpdateArticleInput,
} from './articleApi.types';
import type {
  ArticleCursorPage,
  ArticleDetail,
  ArticleFeedItem,
  ArticleHashtag,
  ArticleSummary,
} from '@/shared/types/article';

class ArticleApiConfigurationError extends Error {
  readonly code = 'ARTICLE_API_NOT_CONFIGURED';

  constructor(message = 'Article API URL is not configured.') {
    super(message);
    this.name = 'ArticleApiConfigurationError';
  }
}

function resolveArticleApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

type ArticleUploadReservationResponse = {
  upload_url?: string;
  uploadUrl?: string;
  file_url?: string;
  fileUrl?: string;
  public_file_url?: string;
  publicFileUrl?: string;
  upload_id?: string;
  uploadId?: string;
  storage_key?: string;
  storageKey?: string;
};

type ArticleUploadConfirmationResponse = {
  file_url?: string;
  fileUrl?: string;
  public_file_url?: string;
  publicFileUrl?: string;
};

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

function buildHashtagSuggestionsQuery(input: ArticleHashtagSuggestionsInput): string {
  const searchParams = new URLSearchParams();
  searchParams.set('q', input.query);
  return `?${searchParams.toString()}`;
}

function buildHashtagFeedPath(input: ArticleHashtagFeedInput): string {
  const encodedHashtag = encodeURIComponent(input.hashtag);
  return `/api/article/feed/hashtag/${encodedHashtag}${buildCursorQuery(input)}`;
}

function resolveArticleUploadFileUrl(
  payload: ArticleUploadReservationResponse | ArticleUploadConfirmationResponse,
): string | null {
  const candidates = [
    payload.public_file_url,
    payload.publicFileUrl,
    payload.file_url,
    payload.fileUrl,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
}

function resolveArticleUploadReservation(
  payload: ArticleUploadReservationResponse,
): {
  uploadUrl: string;
  fileUrl: string;
  uploadId: string | null;
  storageKey: string | null;
} {
  const uploadUrl = payload.upload_url ?? payload.uploadUrl ?? null;
  const fileUrl = resolveArticleUploadFileUrl(payload);

  if (uploadUrl === null || uploadUrl.trim().length === 0 || fileUrl === null) {
    throw new ApiError('', 500, 'ARTICLE_UPLOAD_RESERVATION_INVALID');
  }

  return {
    uploadUrl,
    fileUrl,
    uploadId: payload.upload_id ?? payload.uploadId ?? null,
    storageKey: payload.storage_key ?? payload.storageKey ?? null,
  };
}

async function uploadArticleFileToStorage(input: {
  uploadUrl: string;
  file: ArticleImageUploadInput['file'];
  signal?: AbortSignal;
}): Promise<void> {
  let response: Response;

  try {
    response = await fetch(new URL(input.uploadUrl), {
      method: 'PUT',
      headers: new Headers({
        'Content-Type': input.file.type,
      }),
      body: input.file,
      signal: input.signal,
    });
  } catch (caughtError: unknown) {
    const fallbackMessage = 'Network error while uploading article image to storage.';

    if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
      throw new ApiError(`${fallbackMessage} (${caughtError.message})`, 0, 'NETWORK_ERROR');
    }

    throw new ApiError(fallbackMessage, 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    throw new ApiError('', response.status, 'ARTICLE_UPLOAD_STORAGE_REJECTED');
  }
}

function buildArticleUploadConfirmBody(input: {
  fileUrl: string;
  uploadId: string | null;
  storageKey: string | null;
}): Record<string, string> {
  const body: Record<string, string> = {
    file_url: input.fileUrl,
  };

  if (input.uploadId !== null) {
    body.upload_id = input.uploadId;
  }

  if (input.storageKey !== null) {
    body.storage_key = input.storageKey;
  }

  return body;
}

function createArticleApi(): ArticleApi {
  return {
    async getGlobalFeed(input = {}) {
      return await requestJson<ArticleCursorPage<ArticleFeedItem>>(
        resolveArticleApiBaseUrl(),
        `/api/article/feed${buildCursorQuery(input)}`,
        {
          method: 'GET',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async getMyArticleById(input) {
      return await requestJson<ArticleDetail>(
        resolveArticleApiBaseUrl(),
        `/api/article/articles/${encodeURIComponent(input.articleId)}`,
        {
          method: 'GET',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async getArticleBySlug(input) {
      const encodedSlug = encodeURIComponent(input.slug);

      return await requestJson<ArticleDetail>(
        resolveArticleApiBaseUrl(),
        `/api/article/articles/by-slug/${encodedSlug}`,
        {
          method: 'GET',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async searchArticles(input) {
      return await requestJson<ArticleCursorPage<ArticleFeedItem>>(
        resolveArticleApiBaseUrl(),
        `/api/article/search${buildSearchQuery(input)}`,
        {
          method: 'GET',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async getHashtagFeed(input) {
      return await requestJson<ArticleCursorPage<ArticleFeedItem>>(
        resolveArticleApiBaseUrl(),
        buildHashtagFeedPath(input),
        {
          method: 'GET',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async getHashtagSuggestions(input) {
      return await requestJson<ArticleHashtag[]>(
        resolveArticleApiBaseUrl(),
        `/api/article/hashtags${buildHashtagSuggestionsQuery(input)}`,
        {
          method: 'GET',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async listMyArticles(input) {
      return await requestJson<ArticleCursorPage<ArticleSummary>>(
        resolveArticleApiBaseUrl(),
        `/api/article/me/articles${buildCursorQuery(input)}`,
        {
          method: 'GET',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async listSavedArticles(input) {
      return await requestJson<ArticleCursorPage<ArticleSummary>>(
        resolveArticleApiBaseUrl(),
        `/api/article/me/articles/saved${buildCursorQuery(input)}`,
        {
          method: 'GET',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async createDraft(input) {
      return await requestJson<ArticleDetail>(
        resolveArticleApiBaseUrl(),
        '/api/article/articles',
        {
          method: 'POST',
          signal: input.signal,
          credentials: 'include',
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
        `/api/article/articles/${encodeURIComponent(input.articleId)}`,
        {
          method: 'PUT',
          signal: input.signal,
          credentials: 'include',
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
        `/api/article/articles/${encodeURIComponent(input.articleId)}/publish`,
        {
          method: 'POST',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async unpublishArticle(input) {
      return await requestJson<ArticleDetail>(
        resolveArticleApiBaseUrl(),
        `/api/article/articles/${encodeURIComponent(input.articleId)}/unpublish`,
        {
          method: 'POST',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async deleteArticle(input: ArticleDeleteInput) {
      await requestJson<null>(
        resolveArticleApiBaseUrl(),
        `/api/article/articles/${encodeURIComponent(input.articleId)}`,
        {
          method: 'DELETE',
          signal: input.signal,
          credentials: 'include',
        },
      );
    },

    async recordArticleView(input: ArticleRecordViewInput) {
      await requestJson<null>(
        resolveArticleApiBaseUrl(),
        `/api/article/articles/${encodeURIComponent(input.articleId)}/view`,
        {
          method: 'POST',
          signal: input.signal,
          keepalive: true,
          credentials: 'include',
        },
      );
    },

    async recordArticleOpen(input: ArticleRecordOpenInput) {
      await requestJson<null>(
        resolveArticleApiBaseUrl(),
        `/api/article/articles/${encodeURIComponent(input.articleId)}/open`,
        {
          method: 'POST',
          signal: input.signal,
          keepalive: true,
          credentials: 'include',
        },
      );
    },

    async saveArticle(input: ArticleSaveInput) {
      await requestJson<null>(
        resolveArticleApiBaseUrl(),
        `/api/article/articles/${encodeURIComponent(input.articleId)}/save`,
        {
          method: 'POST',
          signal: input.signal,
          keepalive: true,
          credentials: 'include',
        },
      );
    },

    async uploadImage(input): Promise<ArticleImageUploadResult> {
      const reservationResponse = await requestJson<ArticleUploadReservationResponse>(
        resolveArticleApiBaseUrl(),
        '/api/article/uploads',
        {
          method: 'POST',
          signal: input.signal,
          credentials: 'include',
          body: {
            filename: input.file.name,
            content_type: input.file.type,
            size_bytes: input.file.size,
          },
        },
      );
      const reservation = resolveArticleUploadReservation(reservationResponse);

      await uploadArticleFileToStorage({
        uploadUrl: reservation.uploadUrl,
        file: input.file,
        signal: input.signal,
      });

      const confirmationResponse = await requestJson<ArticleUploadConfirmationResponse>(
        resolveArticleApiBaseUrl(),
        '/api/article/uploads/confirm',
        {
          method: 'POST',
          signal: input.signal,
          credentials: 'include',
          body: buildArticleUploadConfirmBody(reservation),
        },
      );

      return {
        fileUrl: resolveArticleUploadFileUrl(confirmationResponse) ?? reservation.fileUrl,
      };
    },
  };
}

const articleApi = createArticleApi();

export { ArticleApiConfigurationError, articleApi, createArticleApi };
export type {
  ArticleApi,
  ArticleDetailInput,
  ArticleHashtagFeedInput,
  ArticleHashtagSuggestionsInput,
  ArticleImageUploadInput,
  ArticleImageUploadResult,
  ArticleOwnedDetailInput,
  ArticlePublishInput,
  ArticleRecordViewInput,
  ArticleSaveInput,
  ArticleUnpublishInput,
  CreateArticleDraftInput,
  UpdateArticleInput,
  ArticleSearchInput,
};
