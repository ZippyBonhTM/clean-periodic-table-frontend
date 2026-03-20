export const ARTICLE_FEATURE_STAGES = ['off', 'internal', 'public'] as const;

export type ArticleFeatureStage = (typeof ARTICLE_FEATURE_STAGES)[number];

const ARTICLE_FEATURE_STAGE_SET = new Set<ArticleFeatureStage>(ARTICLE_FEATURE_STAGES);
const DEFAULT_ARTICLE_FEATURE_STAGE: ArticleFeatureStage = 'off';

export function resolveArticleFeatureStage(
  rawValue: string | undefined = process.env.NEXT_PUBLIC_ARTICLE_FEATURE_STAGE,
): ArticleFeatureStage {
  if (rawValue === undefined) {
    return DEFAULT_ARTICLE_FEATURE_STAGE;
  }

  const normalizedValue = rawValue.trim().toLowerCase();

  if (!ARTICLE_FEATURE_STAGE_SET.has(normalizedValue as ArticleFeatureStage)) {
    return DEFAULT_ARTICLE_FEATURE_STAGE;
  }

  return normalizedValue as ArticleFeatureStage;
}

export function getArticleFeatureStage(): ArticleFeatureStage {
  return resolveArticleFeatureStage();
}

export function isArticleFeatureEnabled(
  stage: ArticleFeatureStage = getArticleFeatureStage(),
): boolean {
  return stage !== 'off';
}

export function isArticleFeaturePublic(
  stage: ArticleFeatureStage = getArticleFeatureStage(),
): boolean {
  return stage === 'public';
}

export { DEFAULT_ARTICLE_FEATURE_STAGE };
