import { describe, expect, it } from 'vitest';

import {
  buildArticlePrivateListSearchParams,
  countPrivateArticlesByStatus,
  filterPrivateArticlesByStatus,
  resolveArticlePrivateListStatusFilter,
} from '@/shared/articles/articlePrivateListFilters';
import type { ArticleSummary } from '@/shared/types/article';

const SAMPLE_ITEMS: ArticleSummary[] = [
  {
    id: 'article-1',
    title: 'Draft article',
    slug: 'draft-article',
    excerpt: 'Draft excerpt',
    visibility: 'private',
    status: 'draft',
    coverImage: null,
    hashtags: [],
    author: {
      id: 'author-1',
      displayName: 'Ada Lovelace',
      username: 'ada',
      profileImage: null,
    },
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
    publishedAt: null,
  },
  {
    id: 'article-2',
    title: 'Published article',
    slug: 'published-article',
    excerpt: 'Published excerpt',
    visibility: 'public',
    status: 'published',
    coverImage: null,
    hashtags: [],
    author: {
      id: 'author-1',
      displayName: 'Ada Lovelace',
      username: 'ada',
      profileImage: null,
    },
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-03T00:00:00.000Z',
    publishedAt: '2026-03-03T00:00:00.000Z',
  },
  {
    id: 'article-3',
    title: 'Archived article',
    slug: 'archived-article',
    excerpt: 'Archived excerpt',
    visibility: 'private',
    status: 'archived',
    coverImage: null,
    hashtags: [],
    author: {
      id: 'author-1',
      displayName: 'Ada Lovelace',
      username: 'ada',
      profileImage: null,
    },
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-04T00:00:00.000Z',
    publishedAt: null,
  },
];

describe('articlePrivateListFilters', () => {
  it('filters private articles by status without mutating the source list', () => {
    expect(filterPrivateArticlesByStatus(SAMPLE_ITEMS, 'all')).toEqual(SAMPLE_ITEMS);
    expect(filterPrivateArticlesByStatus(SAMPLE_ITEMS, 'draft')).toEqual([SAMPLE_ITEMS[0]]);
    expect(filterPrivateArticlesByStatus(SAMPLE_ITEMS, 'published')).toEqual([SAMPLE_ITEMS[1]]);
    expect(filterPrivateArticlesByStatus(SAMPLE_ITEMS, 'archived')).toEqual([SAMPLE_ITEMS[2]]);
  });

  it('counts loaded articles by status for filter badges and summaries', () => {
    expect(countPrivateArticlesByStatus(SAMPLE_ITEMS)).toEqual({
      all: 3,
      draft: 1,
      published: 1,
      archived: 1,
    });
  });

  it('resolves a private list status filter from query params safely', () => {
    expect(resolveArticlePrivateListStatusFilter({ status: 'draft' })).toBe('draft');
    expect(resolveArticlePrivateListStatusFilter({ status: ['archived', 'draft'] })).toBe(
      'archived',
    );
    expect(resolveArticlePrivateListStatusFilter({ status: 'invalid-status' })).toBe('all');
    expect(resolveArticlePrivateListStatusFilter({})).toBe('all');
  });

  it('builds private list search params without encoding the default all filter', () => {
    expect(
      buildArticlePrivateListSearchParams({
        status: 'published',
      }).toString(),
    ).toBe('status=published');
    expect(
      buildArticlePrivateListSearchParams({
        status: 'all',
      }).toString(),
    ).toBe('');
  });
});
