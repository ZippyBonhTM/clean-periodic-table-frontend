import { describe, expect, it } from 'vitest';

import { buildArticleSlugPreview, parseArticleHashtags } from '@/shared/articles/articleEditorUtils';

describe('articleEditorUtils', () => {
  it('builds an ascii slug preview from a title', () => {
    expect(buildArticleSlugPreview('Introdução à Química Orgânica')).toBe('introducao-a-quimica-organica');
    expect(buildArticleSlugPreview('  ')).toBe('draft-preview');
  });

  it('normalizes, deduplicates, and caps hashtags for the editor', () => {
    expect(parseArticleHashtags('#Química, redox REDOX  orgânica')).toEqual([
      'quimica',
      'redox',
      'organica',
    ]);

    expect(
      parseArticleHashtags('a b c d e f g h i j k'),
    ).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
  });
});
