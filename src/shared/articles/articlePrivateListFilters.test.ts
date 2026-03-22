import { describe, expect, it } from 'vitest';

import {
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
    excerpt: 'Published excerpt about química avançada',
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

  it('resolves the private list sort mode safely from query params', () => {
    expect(resolveArticlePrivateListSort({ sort: 'created-asc' })).toBe('created-asc');
    expect(resolveArticlePrivateListSort({ sort: ['updated-asc', 'created-desc'] })).toBe(
      'updated-asc',
    );
    expect(resolveArticlePrivateListSort({ sort: 'invalid-sort' })).toBe(
      DEFAULT_ARTICLE_PRIVATE_LIST_SORT,
    );
  });

  it('resolves the combined browse filters from status and query params', () => {
    expect(
      resolveArticlePrivateListBrowseFilters({
        status: 'published',
        q: '  orbitals and ions  ',
        sort: 'created-asc',
      }),
    ).toEqual({
      status: 'published',
      query: 'orbitals and ions',
      sort: 'created-asc',
    });
  });

  it('normalizes the local query input safely', () => {
    expect(normalizeArticlePrivateListQuery('  Atomic   Orbitals  ')).toBe('Atomic Orbitals');
    expect(normalizeArticlePrivateListQuery('   ')).toBeNull();
  });

  it('filters loaded private articles by status and query together', () => {
    expect(
      filterPrivateArticles(SAMPLE_ITEMS, {
        status: 'all',
        query: 'ada',
      }),
    ).toEqual(SAMPLE_ITEMS);
    expect(
      filterPrivateArticles(SAMPLE_ITEMS, {
        status: 'published',
        query: 'published excerpt',
      }),
    ).toEqual([SAMPLE_ITEMS[1]]);
    expect(
      filterPrivateArticles(SAMPLE_ITEMS, {
        status: 'published',
        query: 'quimica',
      }),
    ).toEqual([SAMPLE_ITEMS[1]]);
    expect(
      filterPrivateArticles(SAMPLE_ITEMS, {
        status: 'archived',
        query: 'draft',
      }),
    ).toEqual([]);
  });

  it('sorts loaded private articles deterministically', () => {
    expect(sortPrivateArticles(SAMPLE_ITEMS, 'updated-desc').map((item) => item.id)).toEqual([
      'article-3',
      'article-2',
      'article-1',
    ]);
    expect(sortPrivateArticles(SAMPLE_ITEMS, 'created-asc').map((item) => item.id)).toEqual([
      'article-1',
      'article-2',
      'article-3',
    ]);
  });

  it('applies filtering and sorting together for the private workspace', () => {
    expect(
      filterAndSortPrivateArticles(SAMPLE_ITEMS, {
        status: 'all',
        query: 'article',
        sort: 'updated-asc',
      }).map((item) => item.id),
    ).toEqual(['article-1', 'article-2', 'article-3']);
  });

  it('builds private list search params without encoding the default all filter', () => {
    expect(
      buildArticlePrivateListSearchParams({
        status: 'published',
        query: 'atomic orbitals',
        sort: 'created-asc',
      }).toString(),
    ).toBe('status=published&q=atomic+orbitals&sort=created-asc');
    expect(
      buildArticlePrivateListSearchParams({
        status: 'all',
        sort: DEFAULT_ARTICLE_PRIVATE_LIST_SORT,
      }).toString(),
    ).toBe('');
  });
});
