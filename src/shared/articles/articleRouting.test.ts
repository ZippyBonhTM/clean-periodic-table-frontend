import { describe, expect, it } from 'vitest';

import {
  ARTICLE_EDITOR_CREATE_PATHNAME,
  ARTICLE_FEED_PATHNAME,
  ARTICLE_PRIVATE_LIST_PATHNAME,
  ARTICLE_SAVED_LIST_PATHNAME,
  buildLocalizedArticleDetailPath,
  buildLocalizedArticleEditorCreatePath,
  buildLocalizedArticleEditorPath,
  buildLocalizedArticleFeedBrowsePath,
  buildLocalizedArticleFeedPath,
  buildLocalizedArticlePrivateListBrowsePath,
  buildLocalizedArticlePrivateListPath,
  buildLocalizedArticleSavedListPath,
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
    expect(
      buildLocalizedArticlePrivateListBrowsePath('en-US', {
        status: 'archived',
        query: 'ionic bonds',
        sort: 'created-asc',
      }),
    ).toBe('/en/me/articles?status=archived&q=ionic+bonds&sort=created-asc');
    expect(buildLocalizedArticlePrivateListBrowsePath('pt-BR')).toBe('/pt/me/articles');
  });

  it('builds the localized article editor create path outside global app routing', () => {
    expect(ARTICLE_EDITOR_CREATE_PATHNAME).toBe('/me/articles/new');
    expect(buildLocalizedArticleEditorCreatePath('en-US')).toBe('/en/me/articles/new');
    expect(buildLocalizedArticleEditorCreatePath('pt-BR')).toBe('/pt/me/articles/new');
  });

  it('builds the localized saved article list path outside global app routing', () => {
    expect(ARTICLE_SAVED_LIST_PATHNAME).toBe('/me/articles/saved');
    expect(buildLocalizedArticleSavedListPath('en-US')).toBe('/en/me/articles/saved');
    expect(buildLocalizedArticleSavedListPath('pt-BR')).toBe('/pt/me/articles/saved');
  });

  it('builds the localized article editor path for an owned article id', () => {
    expect(buildLocalizedArticleEditorPath('en-US', 'article-123')).toBe('/en/me/articles/article-123');
    expect(buildLocalizedArticleEditorPath('pt-BR', '/article-456/')).toBe('/pt/me/articles/article-456');
  });

  it('builds a localized article detail path using the slug segment', () => {
    expect(buildLocalizedArticleDetailPath('en-US', 'atomic-orbitals')).toBe(
      '/en/articles/atomic-orbitals',
    );
    expect(buildLocalizedArticleDetailPath('pt-BR', '/balance-and-redox/')).toBe(
      '/pt/articles/balance-and-redox',
    );
  });

  it('builds the localized article feed path with search and hashtag filters', () => {
    expect(
      buildLocalizedArticleFeedBrowsePath('en-US', {
        query: 'atomic orbitals',
      }),
    ).toBe('/en/articles?q=atomic+orbitals');
    expect(
      buildLocalizedArticleFeedBrowsePath('pt-BR', {
        hashtag: '#Química Orgânica',
      }),
    ).toBe('/pt/articles?tag=quimica-organica');
    expect(buildLocalizedArticleFeedBrowsePath('en-US')).toBe('/en/articles');
  });
});
