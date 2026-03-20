import type {
  ArticleApi,
  ArticleCursorInput,
  ArticleOwnedDetailInput,
  ArticleSearchInput,
  CreateArticleDraftInput,
  UpdateArticleInput,
} from './articleApi.types';
import type {
  ArticleCursorPage,
  ArticleDetail,
  ArticleFeedItem,
  ArticleSummary,
} from '@/shared/types/article';

const MOCK_AUTHOR = {
  id: 'author-ada-lovelace',
  displayName: 'Ada Lovelace',
  username: 'ada',
  profileImage: null,
} as const;

const MOCK_ARTICLES: ArticleDetail[] = [
  {
    id: 'article-atomic-orbitals',
    title: 'Atomic Orbitals for Curious Beginners',
    slug: 'atomic-orbitals-for-curious-beginners',
    excerpt: 'A compact guide to the shapes, labels, and intuition behind atomic orbitals.',
    markdownSource: '# Atomic Orbitals\n\nStart with s, p, d, and f as probability regions.',
    visibility: 'public',
    status: 'published',
    coverImage: null,
    hashtags: [
      { id: 'tag-chemistry', name: 'chemistry' },
      { id: 'tag-orbitals', name: 'orbitals' },
    ],
    author: MOCK_AUTHOR,
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
    publishedAt: '2026-03-01T12:00:00.000Z',
  },
  {
    id: 'article-stoichiometry-draft',
    title: 'Stoichiometry Notes in Progress',
    slug: 'stoichiometry-notes-in-progress',
    excerpt: 'Working draft for balancing mole ratios without losing intuition.',
    markdownSource: '# Stoichiometry\n\nDraft outline for future expansion.',
    visibility: 'private',
    status: 'draft',
    coverImage: null,
    hashtags: [
      { id: 'tag-stoichiometry', name: 'stoichiometry' },
    ],
    author: MOCK_AUTHOR,
    createdAt: '2026-03-02T09:30:00.000Z',
    updatedAt: '2026-03-02T10:15:00.000Z',
    publishedAt: null,
  },
];

function toFeedItem(article: ArticleDetail): ArticleFeedItem {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    visibility: article.visibility,
    status: article.status,
    coverImage: article.coverImage,
    hashtags: article.hashtags,
    author: article.author,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
    relevanceScore: article.status === 'published' ? 100 : null,
  };
}

function toSummary(article: ArticleDetail): ArticleSummary {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    visibility: article.visibility,
    status: article.status,
    coverImage: article.coverImage,
    hashtags: article.hashtags,
    author: article.author,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
  };
}

function paginateItems<TItem>(
  items: TItem[],
  input: ArticleCursorInput = {},
): ArticleCursorPage<TItem> {
  const pageSize = input.limit ?? items.length;
  const startIndex =
    input.cursor === undefined || input.cursor === null || input.cursor.length === 0
      ? 0
      : Number.parseInt(input.cursor, 10);
  const slice = items.slice(startIndex, startIndex + pageSize);
  const nextIndex = startIndex + slice.length;

  return {
    items: slice,
    nextCursor: nextIndex < items.length ? String(nextIndex) : null,
  };
}

function createMockArticleApi(): ArticleApi {
  return {
    async getGlobalFeed(input = {}) {
      const publishedArticles = MOCK_ARTICLES
        .filter((article) => article.status === 'published' && article.visibility === 'public')
        .map(toFeedItem);

      return paginateItems(publishedArticles, input);
    },

    async getMyArticleById(input: ArticleOwnedDetailInput) {
      const article = MOCK_ARTICLES.find((item) => item.id === input.articleId);

      if (article === undefined) {
        throw new Error(`Mock article not found for id "${input.articleId}".`);
      }

      return article;
    },

    async getArticleBySlug(input) {
      const article = MOCK_ARTICLES.find((item) => item.slug === input.slug);

      if (article === undefined) {
        throw new Error(`Mock article not found for slug "${input.slug}".`);
      }

      return article;
    },

    async searchArticles(input: ArticleSearchInput) {
      const normalizedQuery = input.query.trim().toLowerCase();
      const filteredArticles = MOCK_ARTICLES
        .filter((article) => {
          const searchableText = [
            article.title,
            article.excerpt,
            article.markdownSource,
            ...article.hashtags.map((hashtag) => hashtag.name),
          ]
            .join(' ')
            .toLowerCase();

          return searchableText.includes(normalizedQuery);
        })
        .map(toFeedItem);

      return paginateItems(filteredArticles, input);
    },

    async listMyArticles(input) {
      return paginateItems(MOCK_ARTICLES.map(toSummary), input);
    },

    async createDraft(input: CreateArticleDraftInput) {
      return {
        id: 'article-created-draft',
        title: input.title,
        slug: 'article-created-draft',
        excerpt: input.excerpt ?? '',
        markdownSource: input.markdownSource,
        visibility: input.visibility,
        status: 'draft',
        coverImage: input.coverImage ?? null,
        hashtags: input.hashtags.map((hashtag, index) => ({
          id: `tag-${index + 1}`,
          name: hashtag,
        })),
        author: MOCK_AUTHOR,
        createdAt: '2026-03-03T08:00:00.000Z',
        updatedAt: '2026-03-03T08:00:00.000Z',
        publishedAt: null,
      };
    },

    async updateArticle(input: UpdateArticleInput) {
      const baseArticle = MOCK_ARTICLES.find((article) => article.id === input.articleId) ?? MOCK_ARTICLES[0];

      return {
        ...baseArticle,
        title: input.title ?? baseArticle.title,
        markdownSource: input.markdownSource ?? baseArticle.markdownSource,
        excerpt: input.excerpt ?? baseArticle.excerpt,
        visibility: input.visibility ?? baseArticle.visibility,
        coverImage:
          input.coverImage === undefined ? baseArticle.coverImage : input.coverImage,
        hashtags:
          input.hashtags === undefined
            ? baseArticle.hashtags
            : input.hashtags.map((hashtag, index) => ({
                id: `tag-updated-${index + 1}`,
                name: hashtag,
              })),
        updatedAt: '2026-03-03T08:30:00.000Z',
      };
    },
  };
}

const mockArticleApi = createMockArticleApi();

export { createMockArticleApi, mockArticleApi };
