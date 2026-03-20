import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ARTICLE_FEATURE_STAGE,
  getArticleFeatureStage,
  isArticleFeatureEnabled,
  isArticleFeaturePublic,
  resolveArticleFeatureStage,
} from '@/shared/config/articleFeature';

describe('articleFeature', () => {
  it('defaults to off when the environment variable is missing', () => {
    delete process.env.NEXT_PUBLIC_ARTICLE_FEATURE_STAGE;

    expect(getArticleFeatureStage()).toBe(DEFAULT_ARTICLE_FEATURE_STAGE);
    expect(isArticleFeatureEnabled()).toBe(false);
    expect(isArticleFeaturePublic()).toBe(false);
  });

  it('resolves internal and public stages explicitly', () => {
    expect(resolveArticleFeatureStage('internal')).toBe('internal');
    expect(resolveArticleFeatureStage('public')).toBe('public');
    expect(isArticleFeatureEnabled('internal')).toBe(true);
    expect(isArticleFeaturePublic('public')).toBe(true);
  });

  it('falls back to off for invalid values', () => {
    expect(resolveArticleFeatureStage('beta')).toBe('off');
  });
});
