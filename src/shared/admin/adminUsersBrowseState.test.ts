import { describe, expect, it } from 'vitest';

import type { AdminCursorPage, AdminUserSummary } from '@/shared/types/admin';
import {
  appendAdminUsersPageStack,
  flattenAdminUsersPageStack,
  replaceAdminUsersPageStack,
  resolveAdminUsersPreviousCursor,
  resolveNextAdminUsersBrowseState,
} from '@/shared/admin/adminUsersBrowseState';

function makeUser(id: string): AdminUserSummary {
  return {
    id,
    name: `User ${id}`,
    email: `${id}@example.com`,
    role: 'USER',
    accountVersion: 'legacy',
    accountStatus: 'active',
    createdAt: '2026-03-23T10:00:00.000Z',
    updatedAt: '2026-03-23T10:00:00.000Z',
    lastSeenAt: '2026-03-23T10:00:00.000Z',
  };
}

function makePage(items: AdminUserSummary[], nextCursor: string | null): AdminCursorPage<AdminUserSummary> {
  return {
    items,
    nextCursor,
    prevCursor: null,
  };
}

describe('adminUsersBrowseState', () => {
  it('allows explicit null updates to clear query and cursor', () => {
    expect(
      resolveNextAdminUsersBrowseState(
        {
          role: 'ADMIN',
          version: 'legacy',
          status: 'restricted',
          sort: 'last-seen-desc',
          query: 'ada',
          cursor: 'cursor-1',
        },
        {
          role: 'all',
          version: 'all',
          status: 'all',
          sort: 'created-desc',
          query: null,
          cursor: null,
        },
      ),
    ).toEqual({
      role: 'all',
      version: 'all',
      status: 'all',
      sort: 'created-desc',
      query: null,
      cursor: null,
    });
  });

  it('appends forward pages and resolves the previous cursor from local history', () => {
    const firstStack = replaceAdminUsersPageStack(
      null,
      makePage([makeUser('user-1'), makeUser('user-2')], 'cursor-2'),
    );
    const secondStack = appendAdminUsersPageStack(
      firstStack,
      'cursor-2',
      makePage([makeUser('user-3'), makeUser('user-4')], 'cursor-4'),
    );

    expect(flattenAdminUsersPageStack(secondStack).map((item) => item.id)).toEqual([
      'user-1',
      'user-2',
      'user-3',
      'user-4',
    ]);
    expect(resolveAdminUsersPreviousCursor(secondStack)).toBeNull();

    const thirdStack = appendAdminUsersPageStack(
      secondStack,
      'cursor-4',
      makePage([makeUser('user-5')], null),
    );

    expect(flattenAdminUsersPageStack(thirdStack).map((item) => item.id)).toEqual([
      'user-1',
      'user-2',
      'user-3',
      'user-4',
      'user-5',
    ]);
    expect(resolveAdminUsersPreviousCursor(thirdStack)).toBe('cursor-2');
  });

  it('resets the local stack when the requested cursor does not continue the current sequence', () => {
    const initialStack = replaceAdminUsersPageStack(
      null,
      makePage([makeUser('user-1')], 'cursor-1'),
    );

    const nextStack = appendAdminUsersPageStack(
      initialStack,
      'cursor-other',
      makePage([makeUser('user-9')], null),
    );

    expect(flattenAdminUsersPageStack(nextStack).map((item) => item.id)).toEqual(['user-9']);
  });
});
