import { describe, expect, it } from 'vitest';

import type { AdminAuditEntry, AdminCursorPage } from '@/shared/types/admin';
import {
  appendAdminAuditPageStack,
  flattenAdminAuditPageStack,
  replaceAdminAuditPageStack,
  resolveAdminAuditPreviousCursor,
  resolveNextAdminAuditBrowseState,
} from '@/shared/admin/adminAuditBrowseState';

function makeAuditEntry(id: string): AdminAuditEntry {
  return {
    id,
    action: 'access_check',
    summary: `entry ${id}`,
    occurredAt: '2026-03-23T10:00:00.000Z',
    actor: {
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@example.com',
    },
    target: null,
    ipAddress: null,
  };
}

function makePage(items: AdminAuditEntry[], nextCursor: string | null): AdminCursorPage<AdminAuditEntry> {
  return {
    items,
    nextCursor,
    prevCursor: null,
  };
}

describe('adminAuditBrowseState', () => {
  it('allows explicit null updates to clear query and cursor', () => {
    expect(
      resolveNextAdminAuditBrowseState(
        {
          action: 'moderation',
          query: 'suspicious',
          cursor: 'cursor-1',
        },
        {
          action: 'all',
          query: null,
          cursor: null,
        },
      ),
    ).toEqual({
      action: 'all',
      query: null,
      cursor: null,
    });
  });

  it('appends forward audit pages and keeps previous cursor in local history', () => {
    const firstStack = replaceAdminAuditPageStack(
      null,
      makePage([makeAuditEntry('audit-1'), makeAuditEntry('audit-2')], 'cursor-2'),
    );
    const secondStack = appendAdminAuditPageStack(
      firstStack,
      'cursor-2',
      makePage([makeAuditEntry('audit-3')], null),
    );

    expect(flattenAdminAuditPageStack(secondStack).map((item) => item.id)).toEqual([
      'audit-1',
      'audit-2',
      'audit-3',
    ]);
    expect(resolveAdminAuditPreviousCursor(secondStack)).toBeNull();
  });
});
