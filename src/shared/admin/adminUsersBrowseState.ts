import type { AdminCursorPage, AdminUserSummary } from '@/shared/types/admin';
import type {
  AdminUsersBrowseFilters,
  AdminUsersRoleFilter,
  AdminUsersSort,
  AdminUsersStatusFilter,
  AdminUsersVersionFilter,
} from '@/shared/admin/adminUsersFilters';

type AdminUsersBrowseStateUpdate = {
  role?: AdminUsersRoleFilter;
  version?: AdminUsersVersionFilter;
  status?: AdminUsersStatusFilter;
  sort?: AdminUsersSort;
  query?: string | null;
  cursor?: string | null;
};

type AdminUsersDirectoryPageEntry = {
  requestCursor: string | null;
  page: AdminCursorPage<AdminUserSummary>;
};

function hasOwnValue<TKey extends PropertyKey>(
  value: Record<PropertyKey, unknown>,
  key: TKey,
): value is Record<TKey, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function resolveNextAdminUsersBrowseState(
  current: AdminUsersBrowseFilters,
  update: AdminUsersBrowseStateUpdate,
): AdminUsersBrowseFilters {
  return {
    role: hasOwnValue(update, 'role') ? (update.role as AdminUsersRoleFilter) : current.role,
    version: hasOwnValue(update, 'version')
      ? (update.version as AdminUsersVersionFilter)
      : current.version,
    status: hasOwnValue(update, 'status')
      ? (update.status as AdminUsersStatusFilter)
      : current.status,
    sort: hasOwnValue(update, 'sort') ? (update.sort as AdminUsersSort) : current.sort,
    query: hasOwnValue(update, 'query') ? (update.query ?? null) : current.query,
    cursor: hasOwnValue(update, 'cursor') ? (update.cursor ?? null) : current.cursor,
  };
}

function replaceAdminUsersPageStack(
  requestCursor: string | null,
  page: AdminCursorPage<AdminUserSummary>,
): AdminUsersDirectoryPageEntry[] {
  return [
    {
      requestCursor,
      page,
    },
  ];
}

function appendAdminUsersPageStack(
  current: AdminUsersDirectoryPageEntry[],
  requestCursor: string | null,
  page: AdminCursorPage<AdminUserSummary>,
): AdminUsersDirectoryPageEntry[] {
  const lastEntry = current[current.length - 1];

  if (lastEntry === undefined || lastEntry.page.nextCursor !== requestCursor) {
    return replaceAdminUsersPageStack(requestCursor, page);
  }

  return [
    ...current,
    {
      requestCursor,
      page,
    },
  ];
}

function flattenAdminUsersPageStack(current: AdminUsersDirectoryPageEntry[]): AdminUserSummary[] {
  return current.flatMap((entry) => entry.page.items);
}

function resolveAdminUsersPreviousCursor(current: AdminUsersDirectoryPageEntry[]): string | null {
  if (current.length < 2) {
    return null;
  }

  return current[current.length - 2]?.requestCursor ?? null;
}

export {
  appendAdminUsersPageStack,
  flattenAdminUsersPageStack,
  replaceAdminUsersPageStack,
  resolveAdminUsersPreviousCursor,
  resolveNextAdminUsersBrowseState,
};
export type { AdminUsersBrowseStateUpdate, AdminUsersDirectoryPageEntry };
