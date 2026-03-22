import type { ArticleStatus, ArticleSummary } from '@/shared/types/article';

type ArticlePrivateListStatusFilter = 'all' | ArticleStatus;
type ArticlePrivateListStatusFilterSearchParamsInput = {
  status?: string | string[] | null | undefined;
  q?: string | string[] | null | undefined;
};
type ArticlePrivateListBrowseFilters = {
  status: ArticlePrivateListStatusFilter;
  query: string | null;
};

function normalizeArticlePrivateListQuery(
  value: string | string[] | null | undefined,
): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim().replace(/\s+/g, ' ') ?? '';

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeArticlePrivateListSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function resolveArticlePrivateListStatusFilter(
  input: ArticlePrivateListStatusFilterSearchParamsInput,
): ArticlePrivateListStatusFilter {
  const rawValue = Array.isArray(input.status) ? input.status[0] : input.status;
  const normalizedValue = rawValue?.trim().toLowerCase() ?? '';

  if (
    normalizedValue === 'draft' ||
    normalizedValue === 'published' ||
    normalizedValue === 'archived'
  ) {
    return normalizedValue;
  }

  return 'all';
}

function resolveArticlePrivateListBrowseFilters(
  input: ArticlePrivateListStatusFilterSearchParamsInput,
): ArticlePrivateListBrowseFilters {
  return {
    status: resolveArticlePrivateListStatusFilter(input),
    query: normalizeArticlePrivateListQuery(input.q),
  };
}

function filterPrivateArticlesByStatus(
  items: ArticleSummary[],
  filter: ArticlePrivateListStatusFilter,
): ArticleSummary[] {
  if (filter === 'all') {
    return items;
  }

  return items.filter((item) => item.status === filter);
}

function countPrivateArticlesByStatus(
  items: ArticleSummary[],
): Record<ArticlePrivateListStatusFilter, number> {
  const counts: Record<ArticlePrivateListStatusFilter, number> = {
    all: items.length,
    draft: 0,
    published: 0,
    archived: 0,
  };

  for (const item of items) {
    counts[item.status] += 1;
  }

  return counts;
}

function matchesArticlePrivateListQuery(item: ArticleSummary, query: string): boolean {
  const normalizedQuery = normalizeArticlePrivateListSearchText(query);
  const searchableText = [
    item.title,
    item.slug,
    item.excerpt,
    item.author.displayName ?? '',
    item.author.username ?? '',
    ...item.hashtags.map((hashtag) => hashtag.name),
  ]
    .join(' ');

  return normalizeArticlePrivateListSearchText(searchableText).includes(normalizedQuery);
}

function filterPrivateArticles(
  items: ArticleSummary[],
  filters: ArticlePrivateListBrowseFilters,
): ArticleSummary[] {
  const statusFilteredItems = filterPrivateArticlesByStatus(items, filters.status);

  if (filters.query === null) {
    return statusFilteredItems;
  }

  return statusFilteredItems.filter((item) => matchesArticlePrivateListQuery(item, filters.query!));
}

function buildArticlePrivateListSearchParams(input: {
  status?: ArticlePrivateListStatusFilter | null;
  query?: string | null;
}): URLSearchParams {
  const searchParams = new URLSearchParams();
  const resolvedFilters = resolveArticlePrivateListBrowseFilters({
    status: input.status,
    q: input.query,
  });

  if (resolvedFilters.status !== 'all') {
    searchParams.set('status', resolvedFilters.status);
  }

  if (resolvedFilters.query !== null) {
    searchParams.set('q', resolvedFilters.query);
  }

  return searchParams;
}

export {
  buildArticlePrivateListSearchParams,
  countPrivateArticlesByStatus,
  filterPrivateArticles,
  filterPrivateArticlesByStatus,
  normalizeArticlePrivateListQuery,
  resolveArticlePrivateListBrowseFilters,
  resolveArticlePrivateListStatusFilter,
};
export type {
  ArticlePrivateListBrowseFilters,
  ArticlePrivateListStatusFilter,
  ArticlePrivateListStatusFilterSearchParamsInput,
};
