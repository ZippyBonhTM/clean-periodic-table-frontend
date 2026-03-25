import { describe, expect, it } from 'vitest';

import {
  buildLocalizedHref,
  buildLocalizedPathname,
  buildLocalizedAppPath,
  isLocalizedAppPath,
  normalizeAppPathname,
} from '@/shared/i18n/appLocaleRouting';

describe('appLocaleRouting', () => {
  it('keeps public localized routing behavior for known app paths', () => {
    expect(isLocalizedAppPath('/pt/periodic-table')).toBe(true);
    expect(normalizeAppPathname('/pt/periodic-table')).toBe('/periodic-table');
    expect(buildLocalizedAppPath('en-US', '/periodic-table')).toBe('/en/periodic-table');
  });

  it('replaces the locale segment for admin routes outside the public path set', () => {
    expect(buildLocalizedPathname('en-US', '/pt/admin')).toBe('/en/admin');
    expect(buildLocalizedPathname('en-US', '/pt/admin/users')).toBe('/en/admin/users');
    expect(buildLocalizedPathname('pt-BR', '/en/admin/audit')).toBe('/pt/admin/audit');
  });

  it('replaces the locale segment for non-admin localized routes that are not in the public set', () => {
    expect(buildLocalizedPathname('pt-BR', '/en/articles')).toBe('/pt/articles');
    expect(buildLocalizedPathname('en-US', '/pt/me/articles/saved')).toBe('/en/me/articles/saved');
  });

  it('falls back to the existing public builder for non-localized public app routes', () => {
    expect(buildLocalizedPathname('pt-BR', '/periodic-table')).toBe('/pt/periodic-table');
    expect(buildLocalizedPathname('en-US', '/')).toBe('/en');
  });

  it('preserves query params when building a localized href', () => {
    expect(buildLocalizedHref('en-US', '/pt/admin/users', '?q=test&status=active')).toBe(
      '/en/admin/users?q=test&status=active',
    );
    expect(buildLocalizedHref('pt-BR', '/en/articles', 'cursor=next-page')).toBe(
      '/pt/articles?cursor=next-page',
    );
  });

  it('leaves unrelated non-localized paths untouched', () => {
    expect(buildLocalizedPathname('pt-BR', '/api/auth/login')).toBe('/api/auth/login');
  });
});
