import { describe, expect, it } from 'vitest';

import {
  buildArticleFeedBrowseSearchParams,
  normalizeHashtagValue,
  resolveArticleFeedBrowseFilters,
} from '@/shared/articles/articleFeedFilters';

describe('articleFeedFilters', () => {
  it('resolves the search mode when q is present', () => {
    expect(
      resolveArticleFeedBrowseFilters({
        q: ' atomic orbitals ',
        tag: 'ignored-tag',
      }),
    ).toEqual({
      mode: 'search',
      query: 'atomic orbitals',
      hashtag: null,
    });
  });

  it('resolves the hashtag mode and normalizes the hashtag token', () => {
    expect(
      resolveArticleFeedBrowseFilters({
        tag: '#Órbita_is',
      }),
    ).toEqual({
      mode: 'hashtag',
      query: null,
      hashtag: 'orbita-is',
    });
  });

  it('falls back to the global feed mode when filters are empty', () => {
    expect(
      resolveArticleFeedBrowseFilters({
        q: '   ',
        tag: '  ',
      }),
    ).toEqual({
      mode: 'feed',
      query: null,
      hashtag: null,
    });
  });

  it('builds search params with query taking precedence over hashtag', () => {
    expect(
      buildArticleFeedBrowseSearchParams({
        query: 'redox reactions',
        hashtag: 'ignored-tag',
      }).toString(),
    ).toBe('q=redox+reactions');
  });

  it('builds search params for hashtag browsing', () => {
    expect(
      buildArticleFeedBrowseSearchParams({
        hashtag: '#Química Orgânica',
      }).toString(),
    ).toBe('tag=quimica-organica');
  });

  it('normalizes hashtags consistently for route and API usage', () => {
    expect(normalizeHashtagValue('#Redox')).toBe('redox');
    expect(normalizeHashtagValue('  ')).toBeNull();
  });
});
