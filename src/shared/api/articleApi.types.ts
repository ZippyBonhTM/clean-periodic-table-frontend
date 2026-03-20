import type {
  ArticleCursorPage,
  ArticleDetail,
  ArticleFeedItem,
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

type ArticleDetailInput = {
  slug: string;
  token?: string | null;
  signal?: AbortSignal;
};

type ArticleSearchInput = ArticleCursorInput & {
  query: string;
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

interface ArticleApi {
  getGlobalFeed(input?: ArticleCursorInput): Promise<ArticleCursorPage<ArticleFeedItem>>;
  getArticleBySlug(input: ArticleDetailInput): Promise<ArticleDetail>;
  searchArticles(input: ArticleSearchInput): Promise<ArticleCursorPage<ArticleFeedItem>>;
  listMyArticles(input: ArticleAuthenticatedCursorInput): Promise<ArticleCursorPage<ArticleSummary>>;
  createDraft(input: CreateArticleDraftInput): Promise<ArticleDetail>;
  updateArticle(input: UpdateArticleInput): Promise<ArticleDetail>;
}

export type {
  ArticleApi,
  ArticleAuthenticatedCursorInput,
  ArticleCursorInput,
  ArticleDetailInput,
  ArticleSearchInput,
  CreateArticleDraftInput,
  UpdateArticleInput,
};
