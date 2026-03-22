import { describe, expect, it } from 'vitest';

import {
  ADMIN_PANEL_SECTION_KEYS,
  buildAdminPanelNavigation,
} from '@/shared/admin/adminPanel';

describe('adminPanel', () => {
  it('builds the expected admin navigation order', () => {
    expect(ADMIN_PANEL_SECTION_KEYS).toEqual(['overview', 'users', 'access', 'content']);
    expect(buildAdminPanelNavigation('en-US')).toEqual([
      { key: 'overview', href: '/en/admin' },
      { key: 'users', href: '/en/admin/users' },
      { key: 'access', href: '/en/admin/access' },
      { key: 'content', href: '/en/admin/content' },
    ]);
  });
});
