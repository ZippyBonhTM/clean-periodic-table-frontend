import type { ArticleStatus, ArticleSummary } from '@/shared/types/article';

type ArticlePrivateListStatusFilter = 'all' | ArticleStatus;
type ArticlePrivateListSort =
  | 'updated-desc'
  | 'updated-asc'
  | 'created-desc'
  | 'created-asc';
type ArticlePrivateListStatusFilterSearchParamsInput = {
  status?: string | string[] | null | undefined;
  q?: string | string[] | null | undefined;
  sort?: string | string[] | null | undefined;
};
type ArticlePrivateListBrowseFilters = {
  status: ArticlePrivateListStatusFilter;
  query: string | null;
  sort: ArticlePrivateListSort;
};
const DEFAULT_ARTICLE_PRIVATE_LIST_SORT: ArticlePrivateListSort = 'updated-desc';

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

function resolveArticlePrivateListSort(
  input: ArticlePrivateListStatusFilterSearchParamsInput,
): ArticlePrivateListSort {
  const rawValue = Array.isArray(input.sort) ? input.sort[0] : input.sort;
  const normalizedValue = rawValue?.trim().toLowerCase() ?? '';

  if (
    normalizedValue === 'updated-desc' ||
    normalizedValue === 'updated-asc' ||
    normalizedValue === 'created-desc' ||
    normalizedValue === 'created-asc'
  ) {
    return normalizedValue;
  }

  return DEFAULT_ARTICLE_PRIVATE_LIST_SORT;
}

function resolveArticlePrivateListBrowseFilters(
  input: ArticlePrivateListStatusFilterSearchParamsInput,
): ArticlePrivateListBrowseFilters {
  return {
    status: resolveArticlePrivateListStatusFilter(input),
    query: normalizeArticlePrivateListQuery(input.q),
    sort: resolveArticlePrivateListSort(input),
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

function sortPrivateArticles(
  items: ArticleSummary[],
  sort: ArticlePrivateListSort,
): ArticleSummary[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftTime =
        sort.startsWith('created')
          ? new Date(left.item.createdAt).getTime()
          : new Date(left.item.updatedAt).getTime();
      const rightTime =
        sort.startsWith('created')
          ? new Date(right.item.createdAt).getTime()
          : new Date(right.item.updatedAt).getTime();

      if (leftTime === rightTime) {
        return left.index - right.index;
      }

      if (sort.endsWith('asc')) {
        return leftTime - rightTime;
      }

      return rightTime - leftTime;
    })
    .map(({ item }) => item);
}

function filterAndSortPrivateArticles(
  items: ArticleSummary[],
  filters: ArticlePrivateListBrowseFilters,
): ArticleSummary[] {
  return sortPrivateArticles(filterPrivateArticles(items, filters), filters.sort);
}

function buildArticlePrivateListSearchParams(input: {
  status?: ArticlePrivateListStatusFilter | null;
  query?: string | null;
  sort?: ArticlePrivateListSort | null;
}): URLSearchParams {
  const searchParams = new URLSearchParams();
  const resolvedFilters = resolveArticlePrivateListBrowseFilters({
    status: input.status,
    q: input.query,
    sort: input.sort,
  });

  if (resolvedFilters.status !== 'all') {
    searchParams.set('status', resolvedFilters.status);
  }

  if (resolvedFilters.query !== null) {
    searchParams.set('q', resolvedFilters.query);
  }

  if (resolvedFilters.sort !== DEFAULT_ARTICLE_PRIVATE_LIST_SORT) {
    searchParams.set('sort', resolvedFilters.sort);
  }

  return searchParams;
}

export {
  DEFAULT_ARTICLE_PRIVATE_LIST_SORT,
  buildArticlePrivateListSearchParams,
  countPrivateArticlesByStatus,
  filterAndSortPrivateArticles,
  filterPrivateArticles,
  filterPrivateArticlesByStatus,
  normalizeArticlePrivateListQuery,
  resolveArticlePrivateListBrowseFilters,
  resolveArticlePrivateListSort,
  resolveArticlePrivateListStatusFilter,
  sortPrivateArticles,
};
export type {
  ArticlePrivateListBrowseFilters,
  ArticlePrivateListStatusFilter,
  ArticlePrivateListStatusFilterSearchParamsInput,
  ArticlePrivateListSort,
};
