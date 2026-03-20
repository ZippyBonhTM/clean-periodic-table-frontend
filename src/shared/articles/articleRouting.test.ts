import { describe, expect, it } from 'vitest';

import {
  ARTICLE_FEED_PATHNAME,
  ARTICLE_PRIVATE_LIST_PATHNAME,
  buildLocalizedArticleDetailPath,
  buildLocalizedArticleFeedPath,
  buildLocalizedArticlePrivateListPath,
} from '@/shared/articles/articleRouting';

describe('articleRouting', () => {
  it('builds the localized article feed path without changing global app routing', () => {
    expect(ARTICLE_FEED_PATHNAME).toBe('/articles');
    expect(buildLocalizedArticleFeedPath('en-US')).toBe('/en/articles');
    expect(buildLocalizedArticleFeedPath('pt-BR')).toBe('/pt/articles');
  });

  it('builds the localized private article list path outside global app routing', () => {
    expect(ARTICLE_PRIVATE_LIST_PATHNAME).toBe('/me/articles');
    expect(buildLocalizedArticlePrivateListPath('en-US')).toBe('/en/me/articles');
    expect(buildLocalizedArticlePrivateListPath('pt-BR')).toBe('/pt/me/articles');
  });

  it('builds a localized article detail path using the slug segment', () => {
    expect(buildLocalizedArticleDetailPath('en-US', 'atomic-orbitals')).toBe(
      '/en/articles/atomic-orbitals',
    );
    expect(buildLocalizedArticleDetailPath('pt-BR', '/balance-and-redox/')).toBe(
      '/pt/articles/balance-and-redox',
    );
  });
});
