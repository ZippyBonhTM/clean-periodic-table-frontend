type ArticleVisibility = 'public' | 'private';
type ArticleStatus = 'draft' | 'published' | 'archived';

type ArticleAuthor = {
  id: string;
  displayName: string | null;
  username: string | null;
  profileImage: string | null;
};

type ArticleHashtag = {
  id: string;
  name: string;
};

type ArticleSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  visibility: ArticleVisibility;
  status: ArticleStatus;
  coverImage: string | null;
  hashtags: ArticleHashtag[];
  author: ArticleAuthor;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

type ArticleFeedItem = ArticleSummary & {
  relevanceScore: number | null;
};

type ArticleDetail = ArticleSummary & {
  markdownSource: string;
};

type ArticleCursorPage<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

export type {
  ArticleAuthor,
  ArticleCursorPage,
  ArticleDetail,
  ArticleFeedItem,
  ArticleHashtag,
  ArticleStatus,
  ArticleSummary,
  ArticleVisibility,
};
