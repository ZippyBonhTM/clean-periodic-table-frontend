import type { AdminAuditBrowseFilters, AdminAuditActionFilter } from '@/shared/admin/adminAuditFilters';
import type { AdminAuditEntry, AdminCursorPage } from '@/shared/types/admin';

type AdminAuditBrowseStateUpdate = {
  action?: AdminAuditActionFilter;
  query?: string | null;
  cursor?: string | null;
};

type AdminAuditPageEntry = {
  requestCursor: string | null;
  page: AdminCursorPage<AdminAuditEntry>;
};

function hasOwnValue<TKey extends PropertyKey>(
  value: Record<PropertyKey, unknown>,
  key: TKey,
): value is Record<TKey, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function resolveNextAdminAuditBrowseState(
  current: AdminAuditBrowseFilters,
  update: AdminAuditBrowseStateUpdate,
): AdminAuditBrowseFilters {
  return {
    action: hasOwnValue(update, 'action') ? (update.action as AdminAuditActionFilter) : current.action,
    query: hasOwnValue(update, 'query') ? (update.query ?? null) : current.query,
    cursor: hasOwnValue(update, 'cursor') ? (update.cursor ?? null) : current.cursor,
  };
}

function areAdminAuditBrowseFiltersEqual(
  first: AdminAuditBrowseFilters,
  second: AdminAuditBrowseFilters,
): boolean {
  return (
    first.action === second.action &&
    first.query === second.query &&
    first.cursor === second.cursor
  );
}

function replaceAdminAuditPageStack(
  requestCursor: string | null,
  page: AdminCursorPage<AdminAuditEntry>,
): AdminAuditPageEntry[] {
  return [
    {
      requestCursor,
      page,
    },
  ];
}

function appendAdminAuditPageStack(
  current: AdminAuditPageEntry[],
  requestCursor: string | null,
  page: AdminCursorPage<AdminAuditEntry>,
): AdminAuditPageEntry[] {
  const lastEntry = current[current.length - 1];

  if (lastEntry === undefined || lastEntry.page.nextCursor !== requestCursor) {
    return replaceAdminAuditPageStack(requestCursor, page);
  }

  return [
    ...current,
    {
      requestCursor,
      page,
    },
  ];
}

function flattenAdminAuditPageStack(current: AdminAuditPageEntry[]): AdminAuditEntry[] {
  return current.flatMap((entry) => entry.page.items);
}

function resolveAdminAuditPreviousCursor(current: AdminAuditPageEntry[]): string | null {
  if (current.length < 2) {
    return null;
  }

  return current[current.length - 2]?.requestCursor ?? null;
}

export {
  appendAdminAuditPageStack,
  areAdminAuditBrowseFiltersEqual,
  flattenAdminAuditPageStack,
  replaceAdminAuditPageStack,
  resolveAdminAuditPreviousCursor,
  resolveNextAdminAuditBrowseState,
};
export type { AdminAuditBrowseStateUpdate, AdminAuditPageEntry };
