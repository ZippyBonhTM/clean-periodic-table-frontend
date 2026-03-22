import { describe, expect, it } from 'vitest';

import {
  ADMIN_ACCESS_PATHNAME,
  ADMIN_CONTENT_PATHNAME,
  ADMIN_PANEL_PATHNAME,
  ADMIN_USERS_PATHNAME,
  buildLocalizedAdminAccessPath,
  buildLocalizedAdminContentPath,
  buildLocalizedAdminPath,
  buildLocalizedAdminUsersBrowsePath,
  buildLocalizedAdminUsersPath,
} from '@/shared/admin/adminRouting';

describe('adminRouting', () => {
  it('builds the localized admin panel path outside the public navigation set', () => {
    expect(ADMIN_PANEL_PATHNAME).toBe('/admin');
    expect(buildLocalizedAdminPath('en-US')).toBe('/en/admin');
    expect(buildLocalizedAdminPath('pt-BR')).toBe('/pt/admin');
  });

  it('builds the localized admin users path for management pages', () => {
    expect(ADMIN_USERS_PATHNAME).toBe('/admin/users');
    expect(buildLocalizedAdminUsersPath('en-US')).toBe('/en/admin/users');
    expect(buildLocalizedAdminUsersPath('pt-BR')).toBe('/pt/admin/users');
    expect(
      buildLocalizedAdminUsersBrowsePath('en-US', {
        status: 'planned',
        track: 'directory',
        query: 'users',
      }),
    ).toBe('/en/admin/users?status=planned&track=directory&q=users');
  });

  it('builds the localized admin access path for guardrail pages', () => {
    expect(ADMIN_ACCESS_PATHNAME).toBe('/admin/access');
    expect(buildLocalizedAdminAccessPath('en-US')).toBe('/en/admin/access');
    expect(buildLocalizedAdminAccessPath('pt-BR')).toBe('/pt/admin/access');
  });

  it('builds the localized admin content path for content operations pages', () => {
    expect(ADMIN_CONTENT_PATHNAME).toBe('/admin/content');
    expect(buildLocalizedAdminContentPath('en-US')).toBe('/en/admin/content');
    expect(buildLocalizedAdminContentPath('pt-BR')).toBe('/pt/admin/content');
  });
});
