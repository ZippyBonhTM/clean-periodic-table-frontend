import type {
  ArticleCursorPage,
  ArticleDetail,
  ArticleFeedItem,
  ArticleHashtag,
  ArticleSummary,
  ArticleVisibility,
} from '@/shared/types/article';

type ArticleCursorInput = {
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
};

type ArticleAuthenticatedCursorInput = ArticleCursorInput & {
  token: string;
};

type ArticleOwnedDetailInput = {
  articleId: string;
  token: string;
  signal?: AbortSignal;
};

type ArticleDetailInput = {
  slug: string;
  token?: string | null;
  signal?: AbortSignal;
};

type ArticleSearchInput = ArticleCursorInput & {
  query: string;
};

type ArticleHashtagFeedInput = ArticleCursorInput & {
  hashtag: string;
};

type ArticleHashtagSuggestionsInput = {
  query: string;
  signal?: AbortSignal;
};

type CreateArticleDraftInput = {
  token: string;
  title: string;
  markdownSource: string;
  visibility: ArticleVisibility;
  hashtags: string[];
  excerpt?: string;
  coverImage?: string | null;
  signal?: AbortSignal;
};

type UpdateArticleInput = {
  articleId: string;
  token: string;
  title?: string;
  markdownSource?: string;
  excerpt?: string;
  visibility?: ArticleVisibility;
  hashtags?: string[];
  coverImage?: string | null;
  signal?: AbortSignal;
};

type ArticlePublishInput = {
  articleId: string;
  token: string;
  signal?: AbortSignal;
};

type ArticleUnpublishInput = {
  articleId: string;
  token: string;
  signal?: AbortSignal;
};

type ArticleRecordViewInput = {
  articleId: string;
  token?: string | null;
  signal?: AbortSignal;
};

type ArticleImageUploadInput = {
  token: string;
  file: File;
  signal?: AbortSignal;
};

type ArticleImageUploadResult = {
  fileUrl: string;
};

interface ArticleApi {
  getGlobalFeed(input?: ArticleCursorInput): Promise<ArticleCursorPage<ArticleFeedItem>>;
  getMyArticleById(input: ArticleOwnedDetailInput): Promise<ArticleDetail>;
  getArticleBySlug(input: ArticleDetailInput): Promise<ArticleDetail>;
  searchArticles(input: ArticleSearchInput): Promise<ArticleCursorPage<ArticleFeedItem>>;
  getHashtagFeed(input: ArticleHashtagFeedInput): Promise<ArticleCursorPage<ArticleFeedItem>>;
  getHashtagSuggestions(input: ArticleHashtagSuggestionsInput): Promise<ArticleHashtag[]>;
  listMyArticles(input: ArticleAuthenticatedCursorInput): Promise<ArticleCursorPage<ArticleSummary>>;
  createDraft(input: CreateArticleDraftInput): Promise<ArticleDetail>;
  updateArticle(input: UpdateArticleInput): Promise<ArticleDetail>;
  publishArticle(input: ArticlePublishInput): Promise<ArticleDetail>;
  unpublishArticle(input: ArticleUnpublishInput): Promise<ArticleDetail>;
  recordArticleView(input: ArticleRecordViewInput): Promise<void>;
  uploadImage(input: ArticleImageUploadInput): Promise<ArticleImageUploadResult>;
}

export type {
  ArticleApi,
  ArticleAuthenticatedCursorInput,
  ArticleCursorInput,
  ArticleDetailInput,
  ArticleHashtagFeedInput,
  ArticleHashtagSuggestionsInput,
  ArticleOwnedDetailInput,
  ArticleSearchInput,
  ArticlePublishInput,
  ArticleUnpublishInput,
  ArticleRecordViewInput,
  ArticleImageUploadInput,
  ArticleImageUploadResult,
  CreateArticleDraftInput,
  UpdateArticleInput,
};
