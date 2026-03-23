import { describe, expect, it } from 'vitest';

import {
  buildAdminAuditSearchParams,
  resolveAdminAuditBrowseFilters,
} from '@/shared/admin/adminAuditFilters';

describe('adminAuditFilters', () => {
  it('resolves audit filters from query parameters safely', () => {
    expect(
      resolveAdminAuditBrowseFilters({
        action: 'moderation',
        q: '  suspicious session ',
        cursor: ' next-1 ',
      }),
    ).toEqual({
      action: 'moderation',
      query: 'suspicious session',
      cursor: 'next-1',
    });

    expect(resolveAdminAuditBrowseFilters({ action: 'oops', q: '   ' })).toEqual({
      action: 'all',
      query: null,
      cursor: null,
    });
    expect(resolveAdminAuditBrowseFilters({ action: 'directory_sync' })).toEqual({
      action: 'directory_sync',
      query: null,
      cursor: null,
    });
  });

  it('builds compact search params for non-default audit filters', () => {
    expect(
      buildAdminAuditSearchParams({
        action: 'role_change',
        query: 'admin',
        cursor: 'cursor-2',
      }).toString(),
    ).toBe('action=role_change&q=admin&cursor=cursor-2');

    expect(buildAdminAuditSearchParams({}).toString()).toBe('');
  });
});
