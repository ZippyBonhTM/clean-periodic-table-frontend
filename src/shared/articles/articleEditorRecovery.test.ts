import { describe, expect, it } from 'vitest';

import {
  ARTICLE_EDITOR_RECOVERY_STORAGE_PREFIX,
  ARTICLE_EDITOR_RECOVERY_VERSION,
  buildArticleEditorRecoveryRecord,
  buildArticleEditorRecoveryStorageKey,
  parseArticleEditorRecoveryRecord,
  shouldOfferArticleEditorRecovery,
} from '@/shared/articles/articleEditorRecovery';
import type { ArticleEditorDraftSnapshot } from '@/shared/articles/articleEditorUtils';

const baseDraftSnapshot: ArticleEditorDraftSnapshot = {
  title: 'Atomic Orbitals',
  excerpt: 'Intro to orbitals.',
  markdownSource: '# Atomic Orbitals',
  coverImage: 'https://cdn.example.com/orbitals.webp',
  visibility: 'public',
  hashtags: ['orbitals'],
};

describe('articleEditorRecovery', () => {
  it('builds a scoped storage key for new and existing drafts', () => {
    expect(buildArticleEditorRecoveryStorageKey()).toBe(
      `${ARTICLE_EDITOR_RECOVERY_STORAGE_PREFIX}:new`,
    );
    expect(buildArticleEditorRecoveryStorageKey('  article-123  ')).toBe(
      `${ARTICLE_EDITOR_RECOVERY_STORAGE_PREFIX}:article-123`,
    );
  });

  it('builds and parses a recovery record safely', () => {
    const recoveryRecord = buildArticleEditorRecoveryRecord({
      articleId: 'article-123',
      snapshot: baseDraftSnapshot,
      savedArticleUpdatedAt: '2026-03-22T16:00:00.000Z',
      updatedAt: '2026-03-22T16:05:00.000Z',
    });

    expect(recoveryRecord).toEqual({
      version: ARTICLE_EDITOR_RECOVERY_VERSION,
      articleId: 'article-123',
      snapshot: baseDraftSnapshot,
      savedArticleUpdatedAt: '2026-03-22T16:00:00.000Z',
      updatedAt: '2026-03-22T16:05:00.000Z',
    });

    expect(parseArticleEditorRecoveryRecord(JSON.stringify(recoveryRecord))).toEqual(recoveryRecord);
  });

  it('rejects malformed recovery records', () => {
    expect(parseArticleEditorRecoveryRecord(null)).toBeNull();
    expect(parseArticleEditorRecoveryRecord('')).toBeNull();
    expect(parseArticleEditorRecoveryRecord('{not-json')).toBeNull();
    expect(
      parseArticleEditorRecoveryRecord(
        JSON.stringify({
          version: 99,
          articleId: null,
          snapshot: baseDraftSnapshot,
          savedArticleUpdatedAt: null,
          updatedAt: '2026-03-22T16:05:00.000Z',
        }),
      ),
    ).toBeNull();
    expect(
      parseArticleEditorRecoveryRecord(
        JSON.stringify({
          version: ARTICLE_EDITOR_RECOVERY_VERSION,
          articleId: null,
          snapshot: {
            ...baseDraftSnapshot,
            visibility: 'friends-only',
          },
          savedArticleUpdatedAt: null,
          updatedAt: '2026-03-22T16:05:00.000Z',
        }),
      ),
    ).toBeNull();
  });

  it('offers recovery only when the stored draft differs from the saved draft', () => {
    const recoveryRecord = buildArticleEditorRecoveryRecord({
      snapshot: {
        ...baseDraftSnapshot,
        markdownSource: '# Updated Orbitals',
      },
      updatedAt: '2026-03-22T16:05:00.000Z',
    });

    expect(
      shouldOfferArticleEditorRecovery({
        recoveryRecord,
        savedDraft: baseDraftSnapshot,
      }),
    ).toBe(true);

    expect(
      shouldOfferArticleEditorRecovery({
        recoveryRecord: buildArticleEditorRecoveryRecord({
          snapshot: baseDraftSnapshot,
          updatedAt: '2026-03-22T16:05:00.000Z',
        }),
        savedDraft: baseDraftSnapshot,
      }),
    ).toBe(false);

    expect(
      shouldOfferArticleEditorRecovery({
        recoveryRecord: null,
        savedDraft: baseDraftSnapshot,
      }),
    ).toBe(false);
  });
});
