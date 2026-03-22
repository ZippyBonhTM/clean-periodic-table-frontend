import { describe, expect, it } from 'vitest';

import {
  isAdminUserProfile,
  resolveRequestOrigin,
  shouldRequireAdminForArticleStage,
} from '@/shared/admin/adminAccess';

function createHeaderReader(entries: Record<string, string | undefined>) {
  return {
    get(name: string) {
      return entries[name.toLowerCase()] ?? null;
    },
  };
}

describe('adminAccess', () => {
  it('prefers the request host over forwarded host when resolving the origin', () => {
    const headers = createHeaderReader({
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'preview.example.com',
      host: 'localhost:3000',
    });

    expect(resolveRequestOrigin(headers)).toBe('https://localhost:3000');
  });

  it('falls back to forwarded host when host is unavailable', () => {
    const headers = createHeaderReader({
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'preview.example.com',
    });

    expect(resolveRequestOrigin(headers)).toBe('https://preview.example.com');
  });

  it('falls back to http for local hosts without a forwarded protocol', () => {
    const headers = createHeaderReader({
      host: 'localhost:3000',
    });

    expect(resolveRequestOrigin(headers)).toBe('http://localhost:3000');
  });

  it('detects admin user profiles safely', () => {
    expect(isAdminUserProfile(null)).toBe(false);
    expect(isAdminUserProfile({ role: 'USER' })).toBe(false);
    expect(isAdminUserProfile({ role: 'ADMIN' })).toBe(true);
  });

  it('requires admin access only for internal article previews', () => {
    expect(shouldRequireAdminForArticleStage('off')).toBe(false);
    expect(shouldRequireAdminForArticleStage('internal')).toBe(true);
    expect(shouldRequireAdminForArticleStage('public')).toBe(false);
  });
});
