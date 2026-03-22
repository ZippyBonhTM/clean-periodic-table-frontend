import { describe, expect, it } from 'vitest';

import {
  buildAdminUsersSearchParams,
  resolveAdminUsersBrowseFilters,
} from '@/shared/admin/adminUsersFilters';

describe('adminUsersFilters', () => {
  it('resolves browse filters from query parameters safely', () => {
    expect(
      resolveAdminUsersBrowseFilters({
        role: 'ADMIN',
        status: 'restricted',
        sort: 'last-seen-desc',
        q: '  ada  lovelace ',
        cursor: ' cursor-1 ',
      }),
    ).toEqual({
      role: 'ADMIN',
      status: 'restricted',
      sort: 'last-seen-desc',
      query: 'ada lovelace',
      cursor: 'cursor-1',
    });

    expect(
      resolveAdminUsersBrowseFilters({ role: 'oops', status: '???', sort: '??', q: '   ' }),
    ).toEqual({
      role: 'all',
      status: 'all',
      sort: 'created-desc',
      query: null,
      cursor: null,
    });
  });

  it('builds compact search params for non-default filters', () => {
    expect(
      buildAdminUsersSearchParams({
        role: 'ADMIN',
        status: 'restricted',
        sort: 'last-seen-desc',
        query: 'ada',
        cursor: 'cursor-1',
      }).toString(),
    ).toBe('role=ADMIN&status=restricted&sort=last-seen-desc&q=ada&cursor=cursor-1');

    expect(buildAdminUsersSearchParams({}).toString()).toBe('');
  });
});
