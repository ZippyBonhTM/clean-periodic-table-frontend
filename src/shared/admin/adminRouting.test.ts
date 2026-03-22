import { describe, expect, it } from 'vitest';

import {
  ADMIN_PANEL_PATHNAME,
  ADMIN_USERS_PATHNAME,
  buildLocalizedAdminPath,
  buildLocalizedAdminUsersPath,
} from '@/shared/admin/adminRouting';

describe('adminRouting', () => {
  it('builds the localized admin panel path outside the public navigation set', () => {
    expect(ADMIN_PANEL_PATHNAME).toBe('/admin');
    expect(buildLocalizedAdminPath('en-US')).toBe('/en/admin');
    expect(buildLocalizedAdminPath('pt-BR')).toBe('/pt/admin');
  });

  it('builds the localized admin users path for future management pages', () => {
    expect(ADMIN_USERS_PATHNAME).toBe('/admin/users');
    expect(buildLocalizedAdminUsersPath('en-US')).toBe('/en/admin/users');
    expect(buildLocalizedAdminUsersPath('pt-BR')).toBe('/pt/admin/users');
  });
});
