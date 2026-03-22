import type { ArticleStatus, ArticleSummary } from '@/shared/types/article';

type ArticlePrivateListStatusFilter = 'all' | ArticleStatus;
type ArticlePrivateListStatusFilterSearchParamsInput = {
  status?: string | string[] | null | undefined;
};

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

function buildArticlePrivateListSearchParams(input: {
  status?: ArticlePrivateListStatusFilter | null;
}): URLSearchParams {
  const searchParams = new URLSearchParams();
  const resolvedStatus = resolveArticlePrivateListStatusFilter({
    status: input.status,
  });

  if (resolvedStatus !== 'all') {
    searchParams.set('status', resolvedStatus);
  }

  return searchParams;
}

export {
  buildArticlePrivateListSearchParams,
  countPrivateArticlesByStatus,
  filterPrivateArticlesByStatus,
  resolveArticlePrivateListStatusFilter,
};
export type {
  ArticlePrivateListStatusFilter,
  ArticlePrivateListStatusFilterSearchParamsInput,
};
