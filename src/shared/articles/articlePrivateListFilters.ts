import type { ArticleStatus, ArticleSummary } from '@/shared/types/article';

type ArticlePrivateListStatusFilter = 'all' | ArticleStatus;

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

export { countPrivateArticlesByStatus, filterPrivateArticlesByStatus };
export type { ArticlePrivateListStatusFilter };
